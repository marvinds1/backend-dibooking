/* eslint-disable consistent-return */
/* eslint-disable no-console */
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/user');
const { registerValidation, loginValidation } = require('../utils/validation');
// const verify = require('./verifyToken');

router.post('/register', async (req, res) => {
  const { error } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const emailExists = await User.findOne({ email: req.body.email });
  if (emailExists) return res.status(400).send('Email address already exists');

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  let Id = Math.floor(Math.random() * 1000000000);
  let alreadyExists = await User.findOne({ id: Id });
  while (alreadyExists) {
    Id = Math.floor(Math.random() * 1000000000);
    // eslint-disable-next-line no-await-in-loop
    alreadyExists = await User.findOne({ id: Id });
  }
  const user = new User({
    id: Id,
    name: req.body.name,
    email: req.body.email,
    nomor_ponsel: req.body.nomor_ponsel,
    status: req.body.daftar_sebagai,
    password: hashedPassword,
  });
  try {
    const dbSavedUser = await user.save();
    res.send({ user: dbSavedUser.id });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post('/login', async (req, res) => {
  const { error } = loginValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send('Email or password is wrong 1');
  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) {
    return res.status(400).send('Email or password is wrong 2');
  }
  if (user.status !== req.body.daftar_sebagai) {
    return res.status(400).send('Email or password is wrong 3');
  }
  const refreshToken = jwt.sign(
    { name: user.name },
    process.env.REFRESH_TOKEN_SECRET,
  );
  const token = refreshToken;
  await User.updateOne(
    { email: req.body.email },
    { refreshToken },
  );
  res.cookie('refreshToken', refreshToken, { httpOnly: true });
  res.json({ token });
});

router.delete('/logout', async (req, res) => {
  const { refreshToken } = req.cookies;
  console.log(refreshToken);
  await User.updateOne({ email: req.body.email }, { refreshToken: null });
  res.clearCookie('refreshToken');
  return res.sendStatus(200);
});

module.exports = router;
