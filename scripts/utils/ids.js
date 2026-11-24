const { randomInt } = require('crypto');

const newNumericId = () => randomInt(1, 2 ** 31 - 1);

async function insertWithUniqueId(Model, buildDoc, idField, { session, attempts = 5 } = {}) {
  for (let i = 0; i < attempts; i += 1) {
    const doc = new Model({ ...buildDoc(), [idField]: newNumericId() });
    try {
      return await doc.save({ session });
    } catch (err) {
      const isIdCollision = err.code === 11000 && err.keyPattern && err.keyPattern[idField];
      if (!isIdCollision) throw err;
    }
  }
  throw new Error(`Could not allocate unique ${idField}`);
}

module.exports = { newNumericId, insertWithUniqueId };
