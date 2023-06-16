const mongoose = require('mongoose');

const { Schema } = mongoose;

const pesananSchema = new Schema({
  idPesanan: { type: Number, required: true },
  idUser: { type: Number, required: true },
  idField: { type: Number, required: true },
  tanggal: { type: String, required: true },
  totalPrice: { type: Number, required: true },
  jam: { type: String, required: true },
  status: {
    type: String, required: true, enum: ['Menunggu Pembayaran', 'Menunggu Konfirmasi', 'Dikonfirmasi', 'Dibatalkan', 'Selesai'], default: 'Menunggu Pembayaran',
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('pesanan', pesananSchema);
