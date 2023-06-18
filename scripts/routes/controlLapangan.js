/* eslint-disable prefer-destructuring */
/* eslint-disable no-await-in-loop */
const router = require('express').Router();
const Lapangan = require('../model/lapangan');
const User = require('../model/user');
const Review = require('../model/review');

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

router.get('/rekap', async (req, res) => {
  const token = req.headers.authorization;
  const manager = await User.findOne({ refreshToken: token });
  try {
    const lapangan = await Lapangan.find({ idManager: manager.id });
    const rekap = lapangan.map((lap) => ({
      id: lap.idField,
      name: lap.title,
      kategori: lap.typeField,
      location: lap.location,
      price: lap.price,
    }));
    res.json(rekap);
  } catch (e) {
    res.json({ message: e });
  }
});

router.get('/:id', async (req, res) => {
  const lapangan = await Lapangan.findOne({ idField: req.params.id });
  const reviews = await Review.find({ idField: req.params.id });
  const comment = reviews.map((review) => ({
    id: review.id,
    name: review.nameUser,
    date: new Date(review.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }),
    star: review.rating,
    comment: review.desc,
  }));
  const rating5 = reviews.filter((review) => review.rating === 5).length;
  const rating4 = reviews.filter((review) => review.rating === 4).length;
  const rating3 = reviews.filter((review) => review.rating === 3).length;
  const rating2 = reviews.filter((review) => review.rating === 2).length;
  const rating1 = reviews.filter((review) => review.rating === 1).length;
  const rating0 = reviews.filter((review) => review.rating === 0).length;
  const review = {
    rating: {
      rating5,
      rating4,
      rating3,
      rating2,
      rating1,
      rating0,
    },
    comment,
  };
  const manager = await User.findOne({ id: lapangan.idManager });

  const response = {
    lapangan,
    manager,
    review,
  };
  try {
    res.json({ response });
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
  const token = req.body.token;
  const manager = await User.findOne({ refreshToken: token });
  const newLapangan = new Lapangan({
    title: req.body.title,
    idField: Id,
    idManager: manager.id,
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
