const User = require('../model/User');

const profile = async (req, res) => {
    try {

        const user = await User.findOne({ refreshToken: req.cookies.refreshToken });
        res.json({
            name: user.name,
            email: user.email,
            address: user.address,
            refreshToken: user.refreshToken
        });
    }
    catch (err) {
        console.error(err.message);
    }
}

const update = async (req, res) => {
    try {
        const user = await User.findById(req.user.name);
        user.name = req.body.name;
        user.email = req.body.email;
        user.address = req.body.address;
        await user.save();
        res.json({
            name: user.name,
            email: user.email,
            address: user.address,
        });
    }
    catch (err) {
        console.error(err.message);
    }
}

const destroy = async (req, res) => {
    try {
        const user = await User.findById(req.user.name);
        await user.remove();
        res.json({ message: 'User deleted' });
    }
    catch (err) {
        console.error(err.message);
    }
}

module.exports = { profile, update, destroy };