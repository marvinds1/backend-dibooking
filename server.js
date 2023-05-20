const express = require('express');
const app = express();
const dotenv = require('dotenv');
const db = require('./model');
const cors = require('cors');
const authRoute = require('./routes/auth');
const kelasRoute = require('./routes/kelas');
const propsRoute = require('./routes/props');
const { profile, update, destroy, token } = require('./routes/controlUser');
const verifyToken = require('./routes/verifyToken');
const refreshToken = require('./routes/refreshToken');
const cookieParser = require('cookie-parser');

dotenv.config();
const dbConfig = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
}

db.mongoose.connect(db.url, dbConfig)
    .then(() => { console.log('Connected to the database!'); })
    .catch(err => {
        console.log('Cannot connect to the database!', err); process.exit();
    });

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Header", "*");
    res.header("Access-Control-Allow-Methods", "*");
    next();
});
app.use(cookieParser());
app.use(express.json());
app.use(cors());
app.use('/api/user', authRoute);
app.use('/api/kelas', kelasRoute);
app.use('/api/props', propsRoute);
app.get('/api/user/profile', verifyToken, profile);
app.get('/api/user/refreshToken', refreshToken);

exports.app = app;

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log('Server running on port: http://localhost:' + PORT));