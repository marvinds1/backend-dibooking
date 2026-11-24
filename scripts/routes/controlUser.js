const router = require('express').Router();
const User = require('../model/user');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const schemas = require('../utils/validation');
const HttpError = require('../utils/httpError');
const { REFRESH_COOKIE, refreshCookieOptions } = require('../utils/cookies');

router.use(requireAuth);

router.get('/profile', (req, res) => {
  res.json({ token: req.user });
});

router.put('/update', validate(schemas.updateProfile), asyncHandler(async (req, res) => {
  const user = await User.findOneAndUpdate(
    { id: req.user.id },
    { $set: req.body },
    { new: true, runValidators: true },
  );
  if (!user) throw new HttpError(404, 'User not found');
  res.json({
    name: user.name,
    email: user.email,
    nomor_ponsel: user.nomor_ponsel,
    lokasi: user.lokasi,
  });
}));

router.delete('/delete', asyncHandler(async (req, res) => {
  await User.deleteOne({ id: req.user.id });
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
  res.json({ message: 'User deleted' });
}));

router.put('/topup', validate(schemas.topup), asyncHandler(async (req, res) => {
  const user = await User.findOneAndUpdate(
    { id: req.user.id },
    { $inc: { saldo: req.body.saldo } },
    { new: true },
  );
  res.json({ saldo: user.saldo });
}));

module.exports = router;
