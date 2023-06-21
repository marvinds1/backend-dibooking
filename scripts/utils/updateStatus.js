/* eslint-disable import/no-extraneous-dependencies */
const moment = require('moment');
const Pesanan = require('../model/pesanan');

const updateStatus = async () => {
  try {
    const pesanan1 = await Pesanan.find();
    const pesanan = pesanan1.filter((item) => item.status === 'Dikonfirmasi');
    const date = moment().format('dddd, MMMM DD');
    const time = moment().format('HH:mm');
    pesanan.forEach(async (item) => {
      const itemDate = moment(item.tanggal, 'dddd, MMMM DD').format('dddd, MMMM DD');
      const itemTime = moment(item.jam, 'HH:mm - HH:mm').format('HH:mm');
      if (moment(itemDate, 'dddd, MMMM DD').isSameOrBefore(moment(date, 'dddd, MMMM DD'))) {
        if (moment(itemTime, 'HH:mm').isBefore(moment(time, 'HH:mm'))) {
          await Pesanan.findOneAndUpdate({ idPesanan: item.idPesanan }, { status: 'Selesai' });
        }
      }
    });
  } catch (e) {
    console.log(e);
  }
};

module.exports = updateStatus;
