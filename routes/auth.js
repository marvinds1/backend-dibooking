const router = require('express').Router();
const User = require('../model/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { registerValidation, loginValidation } = require('../validation');
const verify = require('./verifyToken');

router.post('/register', async (req, res) => {
    const { error } = registerValidation(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const emailExists = await User.findOne({ email: req.body.email });
    if (emailExists) return res.status(400).send('Email address already exists');

    const salt = await bcrypt.genSalt(10);
    hashedPassword = await bcrypt.hash(req.body.password, salt);

    const user = new User({
        name: req.body.name,
        email: req.body.email,
        address: req.body.address,
        password: hashedPassword
    });
    try {
        const dbSavedUser = await user.save();
        res.send({ user: dbSavedUser._id });
    } catch (e) {
        res.status(400).send(e);
    }
});

router.post('/login', async (req, res) => {
    const { error } = loginValidation(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send('Email or password is wrong');

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) {
        return res.status(400).send('Email or password is wrong');
    }

    const token = jwt.sign({ name: user.name }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '5m' });
    const refreshToken = jwt.sign({ name: user.name }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1d' });
    await User.updateOne({ email: req.body.email }, { refreshToken: refreshToken })
    res.cookie('refreshToken', refreshToken, { httpOnly: true });
    res.json({ token });
});

router.delete('/logout', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    // if (!refreshToken) return res.sendStatus(401);
    console.log(refreshToken);
    // const user = await User.findOne({ refreshToken: refreshToken });
    await User.updateOne({ email: req.body.email }, { refreshToken: null })
    res.clearCookie('refreshToken');
    return res.sendStatus(200);
});

router.get('/token', async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    console.log(refreshToken);
    if (!refreshToken) return res.sendStatus(401);
    const token = await User.findOne({ refreshToken: refreshToken });
    if (!token) return res.sendStatus(403);
    return res.json({ token: token });
});

module.exports = router;