const dbConfig = require("../config/database");
const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
module.exports = {
    mongoose: mongoose,
    url: dbConfig.url,
    user: require("./User.js")(mongoose),
    kelasOnline: require("./kelasOnline.js")(mongoose),
    konselor: require("./konselor.js")(mongoose),
    testi: require("./testi.js")(mongoose),
    paket: require("./paket.js")(mongoose)
};