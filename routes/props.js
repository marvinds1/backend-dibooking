const router = require('express').Router();
const paket = require('../model/paket');
const konselor = require('../model/konselor');
const testi = require('../model/testi');

router.get('/getProps', async (req, res) => {
    try {
        const allPaket = await paket.find();
        const allKonselor = await konselor.find();
        const allTesti = await testi.find();
        res.json({
            props:
            {
                paket: allPaket.map((paket) => {
                    return {
                        img: paket.pathImg,
                        pic: paket.pic,
                        title: paket.title,
                        desc: paket.desc,
                        price: paket.price,
                        isFav: paket.isFav
                    };
                }),
                testi: allTesti.map((testi) => {
                    return {
                        img: testi.pathImg,
                        name: testi.name,
                        desc: testi.desc,
                        role: testi.role
                    };
                }),
                konselor: allKonselor.map((konselor) => {
                    return {
                        img: konselor.pathImg,
                        name: konselor.name,
                        desc: konselor.desc,
                        role: konselor.role
                    };
                })
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/addPaket', async (req, res) => {
    const titleAndPicExist = await paket.findOne({ title: req.body.title, pic: req.body.pic });
    if (titleAndPicExist) return res.status(400).send('Sudah ada paket serupa');
    const paketBaru = new paket({
        pathImg: req.body.pathImg,
        pic: req.body.pic,
        title: req.body.title,
        desc: req.body.desc,
        price: req.body.price,
        isFav: req.body.isFav
    });
    try {
        const dbSavedKelas = await paketBaru.save();
        res.send({ paket: dbSavedKelas._id });
    } catch (e) {
        res.status(400).send(e);
    }
});

router.post('/addTesti', async (req, res) => {
    const descAndNameExist = await testi.findOne({ desc: req.body.desc, name: req.body.name });
    if (descAndNameExist) return res.status(400).send('Sudah ada testi serupa');
    const testiBaru = new testi({
        pathImg: req.body.pathImg,
        name: req.body.name,
        desc: req.body.desc,
        role: req.body.role
    });
    try {
        const dbSavedTesti = await testiBaru.save();
        res.send({ testi: dbSavedTesti._id });
    } catch (e) {
        res.status(400).send(e);
    }
});


router.post('/addKonselor', async (req, res) => {
    const nameAndRoleExist = await konselor.findOne({ name: req.body.name, role: req.body.role });
    if (nameAndRoleExist) return res.status(400).send('Sudah ada nama dan role serupa');
    const konselorBaru = new konselor({
        pathImg: req.body.pathImg,
        name: req.body.name,
        desc: req.body.desc,
        role: req.body.role
    });
    try {
        const dbSavedKonselor = await konselorBaru.save();
        res.send({ konselor: dbSavedKonselor._id });
    } catch (e) {
        res.status(400).send(e);
    }
});

module.exports = router;