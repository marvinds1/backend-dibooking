/* eslint-disable prefer-destructuring */
/* eslint-disable no-await-in-loop */
const router = require('express').Router();
const Lapangan = require('../model/lapangan');
const User = require('../model/user');

router.get('/detailManager', async (req, res) => {
  const idManager = req.body.idManager;
  const manager = await User.findOne({ id: idManager });
  try {
    res.json(manager);
  } catch (e) {
    res.json({ message: e });
  }
});

router.get('/', async (req, res) => {
  const lapangan = await Lapangan.find();
  try {
    res.json(lapangan);
  } catch (e) {
    res.json({ message: e });
  }
});

router.get('/:id', async (req, res) => {
  const lapangan = await Lapangan.findOne({ idField: req.params.id });
  try {
    const manager = await User.findOne({ id: lapangan.idManager });
    res.json({ lapangan, manager });
  } catch (e) {
    res.json({ message: e });
  }
});

router.post('/add', async (req, res) => {
  let Id = Math.floor(Math.random() * 1000000000);
  let alreadyExists = await Lapangan.findOne({ id: Id });
  while (alreadyExists) {
    Id = Math.floor(Math.random() * 1000000000);
    alreadyExists = await Lapangan.findOne({ id: Id });
  }
  const newLapangan = new Lapangan({
    title: req.body.title,
    idField: Id,
    idManager: req.body.idManager,
    typeField: req.body.typeField,
    imageSrc: req.body.imageSrc,
    location: req.body.location,
    description: req.body.description,
    facilities: req.body.facilities,
    address: req.body.address,
    price: req.body.price,
    rating: 4.5,
    openTime: req.body.openTime,
    closeTime: req.body.closeTime,
  });
  try {
    await newLapangan.save();
    res.json({ message: 'Lapangan added' });
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = router;
