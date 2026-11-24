const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july',
  'august', 'september', 'october', 'november', 'december'];
const DATE_RE = /^[A-Za-z]+,\s+([A-Za-z]+)\s+(\d{1,2})$/;
const TIME_RE = /^([01]\d|2[0-3]):(00)\s*-\s*([01]\d|2[0-4]):(00)$/;
const HOUR_MS = 3600000;
const HALF_YEAR_MS = 183 * 24 * 60 * 60 * 1000;

function parseSlot(tanggal, jam, { now = new Date(), utcOffsetMinutes = 420 } = {}) {
  const d = DATE_RE.exec(String(tanggal || '').trim());
  const t = TIME_RE.exec(String(jam || '').trim());
  if (!d || !t) return null;
  const month = MONTHS.indexOf(d[1].toLowerCase());
  const day = Number(d[2]);
  if (month < 0 || day < 1 || day > 31) return null;

  const offsetMs = utcOffsetMinutes * 60 * 1000;
  const toUtc = (year, h, m) => new Date(Date.UTC(year, month, day, h, m) - offsetMs);
  let year = new Date(now.getTime() + offsetMs).getUTCFullYear();
  let startAt = toUtc(year, Number(t[1]), Number(t[2]));
  if (now - startAt > HALF_YEAR_MS) {
    year += 1;
    startAt = toUtc(year, Number(t[1]), Number(t[2]));
  }
  const local = new Date(startAt.getTime() + offsetMs);
  if (local.getUTCMonth() !== month || local.getUTCDate() !== day) return null;
  const endAt = toUtc(year, Number(t[3]), Number(t[4]));
  const hours = (endAt - startAt) / HOUR_MS;
  if (hours <= 0 || hours > 12) return null;
  const slots = Array.from({ length: hours }, (_, i) => new Date(startAt.getTime() + i * HOUR_MS));
  return {
    startAt, endAt, hours, slots,
  };
}

const totalPrice = (pricePerHour, hours) => Math.round(pricePerHour * hours);

module.exports = { parseSlot, totalPrice };
