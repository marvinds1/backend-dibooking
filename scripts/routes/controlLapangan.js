const router = require('express').Router();
const Lapangan = require('../model/lapangan');
const User = require('../model/user');
const Review = require('../model/review');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const schemas = require('../utils/validation');
const { insertWithUniqueId } = require('../utils/ids');
const HttpError = require('../utils/httpError');

const PUBLIC_MANAGER_FIELDS = 'id name nomor_ponsel lokasi -_id';
const MAX_LIST = 200;

const findFieldOr404 = async (idField) => {
  const lapangan = await Lapangan.findOne({ idField }).lean();
  if (!lapangan) throw new HttpError(404, 'Lapangan not found');
  return lapangan;
};

router.get('/', asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || MAX_LIST, 1), MAX_LIST);
  const filter = {};
  if (req.query.location) filter.location = String(req.query.location);
  if (req.query.type) filter.typeField = String(req.query.type);
  const lapangan = await Lapangan.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
  res.json(lapangan);
}));

router.get('/detailManager', asyncHandler(async (req, res) => {
  const idManager = Number(req.query.idManager ?? (req.body && req.body.idManager));
  if (!Number.isInteger(idManager)) throw new HttpError(400, 'idManager is required');
  const manager = await User.findOne({ id: idManager }).select(PUBLIC_MANAGER_FIELDS).lean();
  if (!manager) throw new HttpError(404, 'Manager not found');
  res.json(manager);
}));

router.get('/rekap', requireAuth, requireRole('Pemilik Lapangan'), asyncHandler(async (req, res) => {
  const lapangan = await Lapangan.find({ idManager: req.user.id }).lean();
  res.json(lapangan.map((lap) => ({
    id: lap.idField,
    name: lap.title,
    kategori: lap.typeField,
    location: lap.location,
    price: lap.price,
  })));
}));

router.get('/detail/:id', asyncHandler(async (req, res) => {
  const lapangan = await findFieldOr404(Number(req.params.id));
  res.json({
    id: lapangan.idField,
    name: lapangan.title,
    kategori: lapangan.typeField,
    lokasi: lapangan.location,
    harga: lapangan.price,
    deskripsi: lapangan.description,
  });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const idField = Number(req.params.id);
  const lapangan = await findFieldOr404(idField);
  const [reviews, manager] = await Promise.all([
    Review.find({ idField }).sort({ createdAt: -1 }).limit(500).lean(),
    User.findOne({ id: lapangan.idManager }).select(PUBLIC_MANAGER_FIELDS).lean(),
  ]);

  const counts = [0, 0, 0, 0, 0, 0];
  const comment = reviews.map((r) => {
    if (counts[r.rating] !== undefined) counts[r.rating] += 1;
    return {
      id: r.id,
      name: r.nameUser,
      date: new Date(r.createdAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true,
      }),
      star: r.rating,
      comment: r.desc,
    };
  });
  const rating = {
    rating5: counts[5],
    rating4: counts[4],
    rating3: counts[3],
    rating2: counts[2],
    rating1: counts[1],
    rating0: counts[0],
  };
  res.json({ response: { lapangan, manager, review: { rating, comment } } });
}));

router.post(
  '/add',
  requireAuth,
  requireRole('Pemilik Lapangan'),
  validate(schemas.createField),
  asyncHandler(async (req, res) => {
    const { token, ...data } = req.body;
    if (data.openTime >= data.closeTime) throw new HttpError(400, 'openTime must be before closeTime');
    const lapangan = await insertWithUniqueId(Lapangan, () => ({
      ...data,
      idManager: req.user.id,
      rating: 0,
    }), 'idField');
    res.status(201).json({ message: 'Lapangan added', idField: lapangan.idField });
  }),
);

router.put(
  '/update/:id',
  requireAuth,
  requireRole('Pemilik Lapangan'),
  validate(schemas.updateField),
  asyncHandler(async (req, res) => {
    const map = {
      nama: 'title', kategori: 'typeField', lokasi: 'location', harga: 'price', deskripsi: 'description',
    };
    const update = Object.fromEntries(Object.entries(req.body).map(([k, v]) => [map[k], v]));
    const result = await Lapangan.updateOne(
      { idField: Number(req.params.id), idManager: req.user.id },
      { $set: update },
      { runValidators: true },
    );
    if (result.matchedCount === 0) throw new HttpError(404, 'Lapangan not found');
    res.json({ message: 'Lapangan updated' });
  }),
);

module.exports = router;
