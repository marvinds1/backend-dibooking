const router = require('express').Router();
const Review = require('../model/review');
const Lapangan = require('../model/lapangan');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const schemas = require('../utils/validation');
const { insertWithUniqueId } = require('../utils/ids');
const HttpError = require('../utils/httpError');

router.post('/add', requireAuth, validate(schemas.createReview), asyncHandler(async (req, res) => {
  const exists = await Lapangan.exists({ idField: req.body.idField });
  if (!exists) throw new HttpError(404, 'Lapangan not found');
  await insertWithUniqueId(Review, () => ({
    idUser: req.user.id,
    nameUser: req.user.name,
    idField: req.body.idField,
    desc: req.body.desc,
    rating: req.body.rating,
  }), 'id');
  res.status(201).json({ message: 'Review added' });
}));

module.exports = router;
