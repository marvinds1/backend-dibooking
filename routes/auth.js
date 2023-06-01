const router = require("express").Router();
const User = require("../model/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { registerValidation, loginValidation } = require("../validation");
const verify = require("./verifyToken");

router.post("/register", async (req, res) => {
  const { error } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const emailExists = await User.findOne({ email: req.body.email });
  if (emailExists) return res.status(400).send("Email address already exists");

  const salt = await bcrypt.genSalt(10);
  hashedPassword = await bcrypt.hash(req.body.password, salt);

  const user = new User({
    name: req.body.name,
    email: req.body.email,
    nomor_ponsel: req.body.nomor_ponsel,
    status: req.body.daftar_sebagai,
    password: hashedPassword,
  });
  try {
    const dbSavedUser = await user.save();
    res.send({ user: dbSavedUser._id });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/login", async (req, res) => {
  const { error } = loginValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send("Email or password is wrong 1");

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) {
    return res.status(400).send("Email or password is wrong 2");
  }
  if (user.status !== req.body.status) {
    return res.status(400).send("Email or password is wrong 3");
  }

  //   const token = jwt.sign({ name: user.name }, process.env.ACCESS_TOKEN_SECRET, {
  //     expiresIn: "15m",
  //   });
  const refreshToken = jwt.sign(
    { name: user.name },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "1d" }
  );
  const token = refreshToken;
  await User.updateOne(
    { email: req.body.email },
    { refreshToken: refreshToken }
  );
  res.cookie("refreshToken", refreshToken, { httpOnly: true });
  res.json({ token });
});

router.delete("/logout", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  console.log(refreshToken);
  await User.updateOne({ email: req.body.email }, { refreshToken: null });
  res.clearCookie("refreshToken");
  return res.sendStatus(200);
});

router.get("/token1", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.sendStatus(401);
  const token = await User.findOne({ refreshToken: refreshToken });
  if (!token) return res.sendStatus(403);
  return res.json({ token: token });
});

router.get("/token", async (req, res) => {
  const refreshToken = req.headers.authorization;
  if (!refreshToken) return res.sendStatus(401);
  console.log(refreshToken);
  const user = await User.findOne({ refreshToken: refreshToken });
  console.log(user);
  res.json({ token: user });
});

module.exports = router;
