/* eslint-disable max-len */
/* eslint-disable no-await-in-loop */
const router = require('express').Router();
const cors = require('cors');
const Pesanan = require('../model/pesanan');
const Lapangan = require('../model/lapangan');
const User = require('../model/user');

const serverTimeout = 60000;

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

router.put('/terima/:id', async (req, res) => {
  try {
    const pesanan = await Pesanan.findOne({ idPesanan: req.params.id });
    pesanan.status = 'Dikonfirmasi';

    const lapangan = await Lapangan.findOne({ idField: pesanan.idField });
    const manager = await User.findOne({ id: lapangan.idManager });

    manager.saldo += pesanan.totalPrice;
    await manager.save();
    await pesanan.save();

    res.json(pesanan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process request' });
  }
});

router.put('/cancel/:id', async (req, res) => {
  const pesanan = await Pesanan.findOne({ idPesanan: req.params.id });
  const penyewa = await User.findOne({ id: pesanan.idUser });
  penyewa.saldo += pesanan.totalPrice;
  pesanan.status = 'Dibatalkan';
  try {
    await pesanan.save();
    await penyewa.save();
    res.json({ message: 'Pesanan updated' });
  } catch (e) {
    res.json({ message: e });
  }
});

router.get('/pesanans', cors(), async (req, res) => {
  try {
    const options = { timeout: serverTimeout };
    const refreshToken = req.headers.authorization;
    const user = await User.findOne({ refreshToken }, null, options).lean();
    const pesanan = await Pesanan.find({ idUser: user.id }, null, options).lean();
    const pesananPromises = pesanan.map(async (pesananItem) => {
      const lapangan1 = await Lapangan.findOne({ idField: pesananItem.idField }, null, options).lean();
      const manager = await User.findOne({ id: lapangan1.idManager }, null, options).lean();
      return {
        idField: pesananItem.idField,
        idPesanan: pesananItem.idPesanan,
        title: lapangan1.title,
        price: lapangan1.price,
        total: pesananItem.totalPrice,
        manager: manager.name,
        nomor_ponsel: manager.nomor_ponsel,
        tanggal: pesananItem.tanggal,
        jam: pesananItem.jam,
        status: pesananItem.status,
      };
    });

    const data = await Promise.all(pesananPromises);

    res.json(data);
  } catch (error) {
    res.json({ message: error.message });
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

router.get('/rekap/:id', async (req, res) => {
  try {
    const lapangan = await Lapangan.find({ idManager: req.params.id });
    const lapanganIds = lapangan.map((lap) => lap.idField);

    const pesananPromises = Pesanan.find({ idField: { $in: lapanganIds } });
    const [pesananResults] = await Promise.all([pesananPromises]);

    const userIds = pesananResults.map((result) => result.idUser);
    const userPromises = User.find({ id: { $in: userIds } });
    const [userResults] = await Promise.all([userPromises]);

    const lapanganMap = new Map();
    lapangan.forEach((lap) => lapanganMap.set(lap.idField, lap.title));

    const response = pesananResults.map((result) => ({
      idPesanan: result.idPesanan,
      nama: userResults.find((user) => user.id === result.idUser).name,
      title: lapanganMap.get(result.idField),
      tanggal: result.tanggal,
      jam: result.jam,
      status: result.status,
    }));
    const tes = response.filter((resp) => resp.status === 'Menunggu Konfirmasi');

    res.json(tes);
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = router;
