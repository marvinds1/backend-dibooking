const mongoose = require('mongoose');

const STATUS = Object.freeze({
  UNPAID: 'Menunggu Pembayaran',
  PAID: 'Menunggu Konfirmasi',
  CONFIRMED: 'Dikonfirmasi',
  CANCELLED: 'Dibatalkan',
  DONE: 'Selesai',
});

const pesananSchema = new mongoose.Schema({
  idPesanan: {
    type: Number, required: true, unique: true, index: true,
  },
  idUser: { type: Number, required: true, index: true },
  idField: { type: Number, required: true, index: true },
  tanggal: { type: String, required: true },
  jam: { type: String, required: true },
  startAt: { type: Date },
  endAt: { type: Date },
  slots: { type: [Date], default: undefined },
  totalPrice: { type: Number, required: true, min: 0 },
  status: {
    type: String, required: true, enum: Object.values(STATUS), default: STATUS.UNPAID,
  },
  active: { type: Boolean, default: true },
}, { timestamps: true });

pesananSchema.index(
  { idField: 1, slots: 1 },
  {
    unique: true,
    partialFilterExpression: { active: true, slots: { $exists: true } },
    name: 'uniq_active_hour',
  },
);
pesananSchema.index({ status: 1, endAt: 1 });

module.exports = mongoose.model('pesanan', pesananSchema);
module.exports.STATUS = STATUS;
