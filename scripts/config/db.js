const mongoose = require('mongoose');
const config = require('./env');

mongoose.set('strictQuery', true);

let connecting = null;
let supportsTransactions = false;

async function connect() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!connecting) {
    connecting = mongoose.connect(config.mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    }).then(async (m) => {
      const hello = await m.connection.db.admin().command({ hello: 1 });
      supportsTransactions = Boolean(hello.setName || hello.msg === 'isdbgrid');
      return m.connection;
    }).catch((err) => {
      connecting = null;
      throw err;
    });
  }
  return connecting;
}

async function withTransaction(work) {
  if (!supportsTransactions) return work(undefined);
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

module.exports = { connect, withTransaction };
