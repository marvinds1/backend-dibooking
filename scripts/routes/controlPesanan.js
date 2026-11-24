const router = require('express').Router();
const config = require('../config/env');
const { withTransaction } = require('../config/db');
const Pesanan = require('../model/pesanan');
const Lapangan = require('../model/lapangan');
const User = require('../model/user');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const schemas = require('../utils/validation');
const { insertWithUniqueId } = require('../utils/ids');
const { parseSlot, totalPrice } = require('../utils/slot');
const HttpError = require('../utils/httpError');

const { STATUS } = Pesanan;
const CANCELLABLE = [STATUS.UNPAID, STATUS.PAID];

router.use(requireAuth);

const managerFieldIds = async (managerId) => (
  await Lapangan.find({ idManager: managerId }).select('idField').lean()
).map((l) => l.idField);

const orderOr404 = async (idPesanan) => {
  const order = await Pesanan.findOne({ idPesanan }).lean();
  if (!order) throw new HttpError(404, 'Pesanan not found');
  return order;
};

router.get('/', asyncHandler(async (req, res) => {
  const orders = await Pesanan.find({ idUser: req.user.id })
    .sort({ createdAt: -1 }).limit(200).lean();
  res.json(orders);
}));

router.post('/add', validate(schemas.createBooking), asyncHandler(async (req, res) => {
  const lapangan = await Lapangan.findOne({ idField: req.body.idField }).lean();
  if (!lapangan) throw new HttpError(404, 'Lapangan not found');

  const slot = parseSlot(req.body.tanggal, req.body.jam, {
    utcOffsetMinutes: config.slotUtcOffsetMinutes,
  });
  if (!slot) throw new HttpError(400, 'Format tanggal/jam tidak valid');
  if (slot.startAt <= new Date()) throw new HttpError(400, 'Slot sudah lewat');
  const [start, end] = req.body.jam.split('-').map((s) => s.trim());
  if (start < lapangan.openTime || end > lapangan.closeTime) {
    throw new HttpError(400, 'Slot di luar jam operasional');
  }

  try {
    const order = await insertWithUniqueId(Pesanan, () => ({
      idUser: req.user.id,
      idField: lapangan.idField,
      tanggal: req.body.tanggal,
      jam: req.body.jam,
      startAt: slot.startAt,
      endAt: slot.endAt,
      slots: slot.slots,
      totalPrice: totalPrice(lapangan.price, slot.hours),
    }), 'idPesanan');
    res.status(201).json(order);
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, 'Slot sudah dibooking');
    throw err;
  }
}));

router.get('/confirmation/:id', asyncHandler(async (req, res) => {
  const order = await orderOr404(Number(req.params.id));
  const lapangan = await Lapangan.findOne({ idField: order.idField }).lean();
  const isRenter = order.idUser === req.user.id;
  const isManager = lapangan && lapangan.idManager === req.user.id;
  if (!isRenter && !isManager) throw new HttpError(404, 'Pesanan not found');

  const [user, manager] = await Promise.all([
    User.findOne({ id: order.idUser }).lean(),
    lapangan ? User.findOne({ id: lapangan.idManager }).lean() : null,
  ]);
  res.json({
    penyewa: {
      name: user && user.name,
      nomor_ponsel: user && user.nomor_ponsel,
      saldo: isRenter && user ? user.saldo : undefined,
    },
    lapangan: {
      title: lapangan && lapangan.title,
      price: lapangan && lapangan.price,
      manager: manager && manager.name,
      nomor_ponsel: manager && manager.nomor_ponsel,
    },
    pesanan: {
      total: order.totalPrice,
      tanggal: order.tanggal,
      jam: order.jam,
      status: order.status,
    },
  });
}));

router.put('/confirmation/:id', asyncHandler(async (req, res) => {
  const idPesanan = Number(req.params.id);
  await withTransaction(async (session) => {
    const order = await Pesanan.findOneAndUpdate(
      { idPesanan, idUser: req.user.id, status: STATUS.UNPAID },
      { $set: { status: STATUS.PAID } },
      { new: true, session },
    );
    if (!order) throw new HttpError(409, 'Pesanan tidak bisa dibayar (sudah dibayar/dibatalkan)');

    const debit = await User.updateOne(
      { id: req.user.id, saldo: { $gte: order.totalPrice } },
      { $inc: { saldo: -order.totalPrice } },
      { session },
    );
    if (debit.modifiedCount === 0) {
      if (!session) {
        await Pesanan.updateOne(
          { idPesanan, status: STATUS.PAID },
          { $set: { status: STATUS.UNPAID } },
        );
      }
      throw new HttpError(402, 'Saldo tidak mencukupi');
    }
  });
  res.json({ message: 'Pesanan updated' });
}));

router.put('/terima/:id', requireRole('Pemilik Lapangan'), asyncHandler(async (req, res) => {
  const fieldIds = await managerFieldIds(req.user.id);
  const order = await withTransaction(async (session) => {
    const updated = await Pesanan.findOneAndUpdate(
      { idPesanan: Number(req.params.id), idField: { $in: fieldIds }, status: STATUS.PAID },
      { $set: { status: STATUS.CONFIRMED } },
      { new: true, session },
    );
    if (!updated) throw new HttpError(409, 'Pesanan tidak dalam status menunggu konfirmasi');
    await User.updateOne(
      { id: req.user.id },
      { $inc: { saldo: updated.totalPrice } },
      { session },
    );
    return updated;
  });
  res.json(order);
}));

router.put('/cancel/:id', asyncHandler(async (req, res) => {
  const idPesanan = Number(req.params.id);
  const isManager = req.user.status === 'Pemilik Lapangan';
  const fieldIds = isManager ? await managerFieldIds(req.user.id) : [];
  await withTransaction(async (session) => {
    const before = await Pesanan.findOneAndUpdate(
      {
        idPesanan,
        status: { $in: CANCELLABLE },
        $or: [{ idUser: req.user.id }, { idField: { $in: fieldIds } }],
      },
      { $set: { status: STATUS.CANCELLED, active: false } },
      { new: false, session },
    );
    if (!before) throw new HttpError(409, 'Pesanan tidak bisa dibatalkan');
    if (before.status === STATUS.PAID) {
      await User.updateOne(
        { id: before.idUser },
        { $inc: { saldo: before.totalPrice } },
        { session },
      );
    }
  });
  res.json({ message: 'Pesanan updated' });
}));

router.get('/pesanans', asyncHandler(async (req, res) => {
  const orders = await Pesanan.find({ idUser: req.user.id })
    .sort({ createdAt: -1 }).limit(200).lean();
  const fieldIds = [...new Set(orders.map((o) => o.idField))];
  const fields = await Lapangan.find({ idField: { $in: fieldIds } }).lean();
  const managerIds = [...new Set(fields.map((f) => f.idManager))];
  const managers = await User.find({ id: { $in: managerIds } })
    .select('id name nomor_ponsel').lean();

  const fieldById = new Map(fields.map((f) => [f.idField, f]));
  const managerById = new Map(managers.map((m) => [m.id, m]));
  res.json(orders.map((o) => {
    const field = fieldById.get(o.idField) || {};
    const manager = managerById.get(field.idManager) || {};
    return {
      idField: o.idField,
      idPesanan: o.idPesanan,
      title: field.title,
      price: field.price,
      total: o.totalPrice,
      manager: manager.name,
      nomor_ponsel: manager.nomor_ponsel,
      tanggal: o.tanggal,
      jam: o.jam,
      status: o.status,
    };
  }));
}));

router.delete('/delete/:id', asyncHandler(async (req, res) => {
  const result = await Pesanan.deleteOne({
    idPesanan: Number(req.params.id),
    idUser: req.user.id,
    status: { $in: [STATUS.UNPAID, STATUS.CANCELLED] },
  });
  if (result.deletedCount === 0) throw new HttpError(409, 'Pesanan tidak bisa dihapus');
  res.json({ message: 'Pesanan deleted' });
}));

const managerPending = asyncHandler(async (req, res) => {
  if (req.params.id && Number(req.params.id) !== req.user.id) {
    throw new HttpError(403, 'Forbidden');
  }
  const fields = await Lapangan.find({ idManager: req.user.id }).select('idField title').lean();
  const orders = await Pesanan.find({
    idField: { $in: fields.map((f) => f.idField) },
    status: STATUS.PAID,
  }).sort({ startAt: 1 }).lean();
  const users = await User.find({ id: { $in: [...new Set(orders.map((o) => o.idUser))] } })
    .select('id name').lean();

  const titleById = new Map(fields.map((f) => [f.idField, f.title]));
  const nameById = new Map(users.map((u) => [u.id, u.name]));
  res.json(orders.map((o) => ({
    idPesanan: o.idPesanan,
    nama: nameById.get(o.idUser),
    title: titleById.get(o.idField),
    tanggal: o.tanggal,
    jam: o.jam,
    status: o.status,
  })));
});

router.get('/rekap', requireRole('Pemilik Lapangan'), managerPending);
router.get('/rekap/:id', requireRole('Pemilik Lapangan'), managerPending);

module.exports = router;
