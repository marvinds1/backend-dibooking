const test = require('node:test');
const assert = require('node:assert');

const uri = process.env.TEST_MONGODB_URI;
const skip = !uri && 'set TEST_MONGODB_URI to run integration tests';

test('booking flow is safe under concurrent requests', { skip }, async (t) => {
  Object.assign(process.env, {
    MONGODB_URI: uri,
    ACCESS_TOKEN_SECRET: 'test-access-secret-test-access-secret',
    REFRESH_TOKEN_SECRET: 'test-refresh-secret-test-refresh-secret',
  });
  const mongoose = require('mongoose');
  const app = require('../scripts/app');
  const { connect } = require('../scripts/config/db');
  const User = require('../scripts/model/user');
  const Pesanan = require('../scripts/model/pesanan');

  await connect();
  await mongoose.connection.db.dropDatabase();
  await Promise.all(mongoose.modelNames().map((n) => mongoose.model(n).syncIndexes()));
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    server.close();
    await mongoose.disconnect();
  });

  const call = async (method, path, body, token) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'content-type': 'application/json', ...(token && { authorization: token }) },
      body: body && JSON.stringify(body),
    });
    return { status: res.status, body: await res.json().catch(() => null) };
  };
  const signup = async (email, role) => {
    await call('POST', '/api/user/register', {
      name: 'Tester', email, nomor_ponsel: '081234567890', daftar_sebagai: role, password: 'password123',
    });
    return (await call('POST', '/api/user/login', { email, password: 'password123', daftar_sebagai: role })).body.token;
  };

  const owner = await signup('owner@example.com', 'Pemilik Lapangan');
  const renter = await signup('renter@example.com', 'Penyewa');
  const renter2 = await signup('renter2@example.com', 'Penyewa');

  const field = await call('POST', '/api/lapangan/add', {
    title: 'Lapangan Uji', typeField: 'Futsal', imageSrc: 'https://example.com/a.jpg',
    location: 'Tembalang', description: 'Lapangan untuk test', address: 'Jl. Test 1',
    price: 30000, openTime: '08:00', closeTime: '22:00',
  }, owner);
  assert.strictEqual(field.status, 201);
  const { idField } = field.body;

  const tomorrow = new Date(Date.now() + 2 * 86400000);
  const tanggal = tomorrow.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta',
  });
  const booking = { idField, tanggal, jam: '10:00 - 12:00', total: 1 };

  const bookings = await Promise.all(Array.from({ length: 10 }, (_, i) => call('POST', '/api/pemesanan/add', booking, i % 2 ? renter : renter2)));
  const created = bookings.filter((r) => r.status === 201);
  assert.strictEqual(created.length, 1, 'only one booking per slot');
  assert.strictEqual(bookings.filter((r) => r.status === 409).length, 9);
  const order = created[0].body;
  assert.strictEqual(order.totalPrice, 60000, 'client-sent total is ignored');
  const payer = order.idUser === (await call('GET', '/api/user/profile', null, renter)).body.token.id ? renter : renter2;
  const other = payer === renter ? renter2 : renter;

  assert.strictEqual((await call('PUT', `/api/pemesanan/confirmation/${order.idPesanan}`, null, other)).status, 409, 'cannot pay someone else\'s order');

  const pays = await Promise.all(Array.from({ length: 10 }, () => call('PUT', `/api/pemesanan/confirmation/${order.idPesanan}`, null, payer)));
  assert.strictEqual(pays.filter((r) => r.status === 200).length, 1, 'paid exactly once');
  const afterPay = (await call('GET', '/api/user/profile', null, payer)).body.token;
  assert.strictEqual(afterPay.saldo, 40000);
  assert.strictEqual(afterPay.password, undefined);

  assert.strictEqual((await call('PUT', `/api/pemesanan/terima/${order.idPesanan}`, null, payer)).status, 403);
  const accepts = await Promise.all(Array.from({ length: 5 }, () => call('PUT', `/api/pemesanan/terima/${order.idPesanan}`, null, owner)));
  assert.strictEqual(accepts.filter((r) => r.status === 200).length, 1, 'manager credited once');
  assert.strictEqual((await call('GET', '/api/user/profile', null, owner)).body.token.saldo, 160000);

  assert.strictEqual((await call('PUT', `/api/pemesanan/cancel/${order.idPesanan}`, null, payer)).status, 409, 'confirmed order cannot be cancelled for refund');

  const order2 = (await call('POST', '/api/pemesanan/add', { ...booking, jam: '12:00 - 14:00' }, payer)).body;
  await call('PUT', `/api/pemesanan/confirmation/${order2.idPesanan}`, null, payer);
  const cancels = await Promise.all(Array.from({ length: 5 }, () => call('PUT', `/api/pemesanan/cancel/${order2.idPesanan}`, null, payer)));
  assert.strictEqual(cancels.filter((r) => r.status === 200).length, 1, 'refunded once');
  assert.strictEqual((await call('GET', '/api/user/profile', null, payer)).body.token.saldo, 40000);

  const rebook = await call('POST', '/api/pemesanan/add', { ...booking, jam: '12:00 - 14:00' }, other);
  assert.strictEqual(rebook.status, 201, 'cancelled slot is free again');

  const poor = await call('PUT', `/api/pemesanan/confirmation/${rebook.body.idPesanan}`, null, other);
  assert.strictEqual(poor.status, 200);
  const order3 = (await call('POST', '/api/pemesanan/add', { ...booking, jam: '14:00 - 16:00' }, other)).body;
  assert.strictEqual((await call('PUT', `/api/pemesanan/confirmation/${order3.idPesanan}`, null, other)).status, 402, 'insufficient balance');
  assert.strictEqual((await Pesanan.findOne({ idPesanan: order3.idPesanan })).status, 'Menunggu Pembayaran', 'status rolled back');
  assert.strictEqual((await User.findOne({ email: 'renter@example.com' })).saldo >= 0, true);

  assert.strictEqual((await call('GET', '/api/detail/profile', null, 'forged.token.value')).status, 401);
});
