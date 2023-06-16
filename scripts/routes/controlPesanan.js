/* eslint-disable no-await-in-loop */
const router = require('express').Router();
const Pesanan = require('../model/pesanan');
const Lapangan = require('../model/lapangan');
const User = require('../model/user');

router.get('/', async (req, res) => {
  const pesanan = await Pesanan.find();
  try {
    res.json(pesanan);
  } catch (e) {
    res.json({ message: e });
  }
});

router.post('/add', async (req, res) => {
  let Id = Math.floor(Math.random() * 1000000000);
  let alreadyExists = await Pesanan.findOne({ id: Id });
  while (alreadyExists) {
    Id = Math.floor(Math.random() * 1000000000);
    alreadyExists = await Pesanan.findOne({ id: Id });
  }
  const newPesanan = new Pesanan({
    idPesanan: Id,
    idUser: req.body.idUser,
    totalPrice: req.body.total,
    idField: req.body.idField,
    tanggal: req.body.tanggal,
    jam: req.body.jam,
  });
  try {
    await newPesanan.save();
    res.json(newPesanan);
  } catch (e) {
    res.json({ message: e });
  }
});

router.get('/confirmation/:id', async (req, res) => {
  const pesanan = await Pesanan.findOne({ idPesanan: req.params.id });
  const user = await User.findOne({ id: pesanan.idUser });
  const lapangan = await Lapangan.findOne({ idField: pesanan.idField });
  const manager = await User.findOne({ id: lapangan.idManager });
  const response = {
    penyewa: {
      name: user.name,
      nomor_ponsel: user.nomor_ponsel,
      saldo: user.saldo,
    },
    lapangan: {
      title: lapangan.title,
      price: lapangan.price,
      manager: manager.name,
      nomor_ponsel: manager.nomor_ponsel,
    },
    pesanan: {
      total: pesanan.totalPrice,
      tanggal: pesanan.tanggal,
      jam: pesanan.jam,
      status: pesanan.status,
    },
  };
  try {
    res.json(response);
  } catch (e) {
    res.json({ message: e });
  }
});

router.put('/confirmation/:id', async (req, res) => {
  const pesanan = await Pesanan.findOne({ idPesanan: req.params.id });
  const penyewa = await User.findOne({ id: pesanan.idUser });
  penyewa.saldo -= pesanan.totalPrice;
  pesanan.status = 'Menunggu Konfirmasi';
  try {
    await pesanan.save();
    await penyewa.save();
    res.json({ message: 'Pesanan updated' });
  } catch (e) {
    res.json({ message: e });
  }
});

router.get('/pesanans', async (req, res) => {
  const refreshToken = req.headers.authorization;
  const user = await User.findOne({ refreshToken });
  const pesanan = await Pesanan.find({ idUser: user.id });
  const data = [];
  for (let i = 0; i < pesanan.length; i += 1) {
    const lapangan1 = await Lapangan.findOne({ idField: pesanan[i].idField });
    const manager = await User.findOne({ id: lapangan1.idManager });
    data.push({
      idPesanan: pesanan[i].idPesanan,
      title: lapangan1.title,
      price: lapangan1.price,
      total: pesanan[i].totalPrice,
      manager: manager.name,
      nomor_ponsel: manager.nomor_ponsel,
      tanggal: pesanan[i].tanggal,
      jam: pesanan[i].jam,
      status: pesanan[i].status,
    });
  }
  try {
    res.json(data);
  } catch (e) {
    res.json({ message: e });
  }
});

router.delete('/delete/:id', async (req, res) => {
  const pesanan = await Pesanan.findOne({ idPesanan: req.params.id });
  try {
    await pesanan.remove();
    res.json({ message: 'Pesanan deleted' });
  } catch (e) {
    res.json({ message: e });
  }
});

module.exports = router;
