const Pesanan = require('../model/pesanan');

const { STATUS } = Pesanan;
let running = false;

async function updateStatus(now = new Date()) {
  if (running) return { skipped: true };
  running = true;
  try {
    const result = await Pesanan.updateMany(
      { status: STATUS.CONFIRMED, endAt: { $lte: now } },
      { $set: { status: STATUS.DONE } },
    );
    return { updated: result.modifiedCount };
  } finally {
    running = false;
  }
}

module.exports = updateStatus;
