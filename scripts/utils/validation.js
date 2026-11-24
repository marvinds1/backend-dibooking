const Joi = require('joi');
const locations = require('../data/lokasi');
const fieldTypes = require('../data/typeLapangan');

const ROLES = ['Penyewa', 'Pemilik Lapangan'];
const time = Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/);

const register = Joi.object({
  name: Joi.string().trim().min(3).max(100)
    .required(),
  email: Joi.string().trim().lowercase().email()
    .max(255)
    .required(),
  nomor_ponsel: Joi.string().trim().pattern(/^\+?[0-9]{8,15}$/).required(),
  daftar_sebagai: Joi.string().valid(...ROLES).required(),
  password: Joi.string().min(8).max(72).required(),
});

const login = Joi.object({
  email: Joi.string().trim().lowercase().email()
    .required(),
  password: Joi.string().max(72).required(),
  daftar_sebagai: Joi.string().valid(...ROLES).required(),
});

const updateProfile = Joi.object({
  name: Joi.string().trim().min(3).max(100),
  email: Joi.string().trim().lowercase().email()
    .max(255),
  nomor_ponsel: Joi.string().trim().pattern(/^\+?[0-9]{8,15}$/),
  lokasi: Joi.string().valid(...locations),
});

const topup = Joi.object({
  saldo: Joi.number().integer().min(1000).max(10000000)
    .required(),
});

const createField = Joi.object({
  title: Joi.string().trim().min(5).max(255)
    .required(),
  typeField: Joi.string().valid(...fieldTypes).required(),
  imageSrc: Joi.alternatives(
    Joi.string().max(1024).uri({ scheme: ['https', 'http'] }),
    Joi.string().max(1024).pattern(/^[\w./-]+$/),
    Joi.string().valid(''),
  ),
  location: Joi.string().valid(...locations).required(),
  description: Joi.string().trim().min(5).max(1000)
    .required(),
  facilities: Joi.alternatives(Joi.number().integer().min(0), Joi.string().allow('').max(500)),
  address: Joi.string().trim().min(5).max(255)
    .required(),
  price: Joi.number().integer().min(0).max(100000000)
    .required(),
  openTime: time.required(),
  closeTime: time.required(),
  token: Joi.string(),
});

const updateField = Joi.object({
  nama: Joi.string().trim().min(5).max(255),
  kategori: Joi.string().valid(...fieldTypes),
  lokasi: Joi.string().valid(...locations),
  harga: Joi.number().integer().min(0).max(100000000),
  deskripsi: Joi.string().trim().min(5).max(1000),
});

const createBooking = Joi.object({
  idField: Joi.number().integer().required(),
  tanggal: Joi.string().max(40).required(),
  jam: Joi.string().max(20).required(),
  idUser: Joi.any(),
  total: Joi.any(),
});

const createReview = Joi.object({
  idField: Joi.number().integer().required(),
  desc: Joi.string().trim().min(5).max(511)
    .required(),
  rating: Joi.number().integer().min(0).max(5)
    .required(),
  nameUser: Joi.any(),
});

module.exports = {
  ROLES,
  register,
  login,
  updateProfile,
  topup,
  createField,
  updateField,
  createBooking,
  createReview,
};
