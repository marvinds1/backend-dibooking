const router = require('express').Router();
const kelasOnline = require('../model/kelasOnline');

router.get('/getKelas', async (req, res) => {
    try {
        const kelas = await kelasOnline.find();
        res.json(
            kelas.map((kelas) => {
                return {
                    title: kelas.title,
                    pathImg: kelas.pathImg
                };
            })
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/addKelas', async (req, res) => {
    const titleExist = await kelasOnline.findOne({ title: req.body.title });
    if (titleExist) return res.status(400).send('Sudah ada kelas serupa');
    const kelas = new kelasOnline({
        title: req.body.title,
        pathImg: req.body.pathImg
    });
    try {
        const dbSavedKelas = await kelas.save();
        res.send({ kelas: dbSavedKelas._id });
    } catch (e) {
        res.status(400).send(e);
    }
});

module.exports = router;