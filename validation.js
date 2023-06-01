const Joi = require('joi');

const registerValidation = data => {
    const schema = Joi.object({
        nama: Joi.string()
            .min(3)
            .required(),
        email: Joi.string()
            .min(6)
            .required()
            .email(),
        nomor_ponsel: Joi.string()
            .min(5)
            .max(255)
            .required(),
        daftar_sebagai: Joi.string()
            .valid('Penyewa', 'Pemilik Lapangan')
            .required(),
        password: Joi.string()
            .min(6)
            .required()
    });
    return schema.validate(data);
};

const loginValidation = data => {
    const schema = Joi.object({
        email: Joi.string()
            .min(6)
            .required()
            .email(),
        password: Joi.string()
            .min(6)
            .required(),
        status: Joi.string()
            .valid('Penyewa', 'Pemilik Lapangan')
            .required()
    });
    return schema.validate(data);
};

module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;