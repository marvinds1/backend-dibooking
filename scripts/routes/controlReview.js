/* eslint-disable no-await-in-loop */
const router = require('express').Router();
const Review = require('../model/review');

router.post('/add', async (req, res) => {
  let Id = Math.floor(Math.random() * 1000000000);
  let alreadyExists = await Review.findOne({ id: Id });
  while (alreadyExists) {
    Id = Math.floor(Math.random() * 1000000000);
    alreadyExists = await Review.findOne({ id: Id });
  }
  const newReview = new Review({
    id: Id,
    nameUser: req.body.nameUser,
    idField: req.body.idField,
    desc: req.body.desc,
    rating: req.body.rating,
  });
  try {
    await newReview.save();
    res.json({ message: 'Review added' });
  } catch (e) {
    res.json({ message: e });
  }
});

module.exports = router;
