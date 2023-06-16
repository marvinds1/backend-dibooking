/* eslint-disable consistent-return */
/* eslint-disable no-console */
const User = require('../model/user');
const router = require('./auth');

router.get('/profile', async (req, res) => {
  const refreshToken = req.headers.authorization;
  if (!refreshToken) return res.sendStatus(401);
  const user = await User.findOne({ refreshToken });
  res.json({ token: user });
});

router.put('/update', async (req, res) => {
  const refreshToken = req.headers.authorization;
  if (!refreshToken) return res.sendStatus(401);
  const user = await User.findOne({ refreshToken });
  user.name = req.body.name;
  user.email = req.body.email;
  user.nomor_ponsel = req.body.nomor_ponsel;
  user.lokasi = req.body.lokasi;
  await user.save();
  res.json({
    name: user.name,
    email: user.email,
    nomor_ponsel: user.nomor_ponsel,
    lokasi: user.lokasi,
  });
});

router.delete('/delete', async (req, res) => {
  const refreshToken = req.headers.authorization;
  if (!refreshToken) return res.sendStatus(401);
  const user = await User.findOne({ refreshToken });
  await user.remove();
  res.json({ message: 'User deleted' });
});

module.exports = router;
