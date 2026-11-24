# backend-dibooking

REST API for **Dibooking**, a sports-field booking app (futsal, badminton, basketball, …). Renters book a time slot and pay from an in-app balance; field owners list their fields and confirm incoming bookings. The React client lives in [FrontendDibooking](https://github.com/marvinds1/FrontendDibooking).

Originally built in 2023; refactored in 2026 to harden security and make the booking/payment flow safe under concurrent requests.

## Stack

Node.js 20+, Express 4, MongoDB (Mongoose 8), JWT (access + rotating refresh token), Joi, Helmet, express-rate-limit. Deployable to Vercel (serverless) or as a long-running Node process.

## Booking lifecycle

```
Menunggu Pembayaran ──pay──▶ Menunggu Konfirmasi ──owner accepts──▶ Dikonfirmasi ──slot ends──▶ Selesai
        │                          │
        └────────cancel────────────┴──▶ Dibatalkan (refund if it was already paid)
```

Every transition is a single conditional update (`findOneAndUpdate({ status: <expected> })`), so a state can only be left once — no matter how many requests arrive at the same time.

## API overview

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/user/register` | – | Register as `Penyewa` (renter) or `Pemilik Lapangan` (owner) |
| POST | `/api/user/login` | – | Returns `{ token }` (short-lived access token) + `refreshToken` httpOnly cookie |
| POST | `/api/user/token` | cookie | Rotate refresh token, get a new access token |
| DELETE | `/api/user/logout` | cookie | Revoke the current refresh token |
| GET / PUT / DELETE | `/api/detail/profile`, `/update`, `/delete` | ✔ | Own profile |
| PUT | `/api/detail/topup` | ✔ | Add balance (demo only, no payment gateway) |
| GET | `/api/lapangan`, `/api/lapangan/:id`, `/api/lapangan/detail/:id` | – | Browse fields, reviews, rating breakdown |
| POST / PUT | `/api/lapangan/add`, `/api/lapangan/update/:id` | owner | Manage own fields |
| GET | `/api/lapangan/rekap` | owner | Own field list |
| POST | `/api/pemesanan/add` | ✔ | Book a slot (`tanggal: "Monday, November 24"`, `jam: "08:00 - 10:00"`) |
| GET / PUT | `/api/pemesanan/confirmation/:id` | renter | View / pay a booking |
| PUT | `/api/pemesanan/terima/:id` | owner | Accept a paid booking (credits owner) |
| PUT | `/api/pemesanan/cancel/:id` | renter / owner | Cancel (refund if paid) |
| GET | `/api/pemesanan/pesanans` | ✔ | Own booking history |
| GET | `/api/pemesanan/rekap` | owner | Bookings waiting for confirmation |
| POST | `/api/review/add` | ✔ | Review a field |
| GET | `/api/internal/cron/update-status` | `CRON_SECRET` | Mark finished bookings as `Selesai` |
| GET | `/healthz` | – | Liveness probe |

The access token is accepted as `Authorization: Bearer <token>` or the raw token (for backward compatibility with the original client).

## Security

- **No secrets in code.** DB URI and JWT secrets come from environment variables; the app refuses to start if they are missing (`scripts/config/env.js`).
- **Authentication:** access token (HS256, default 1 h) + refresh token (7 d) in an httpOnly cookie. Refresh tokens are stored hashed, rotated on every use, capped at 5 sessions per user; reusing an old refresh token revokes all sessions.
- **Authorization on every mutation:** user identity comes from the token, never from the request body. Renters can only pay/cancel their own bookings; owners can only edit their own fields and accept bookings on them.
- **Server-side pricing:** total price = field price × slot duration, computed on the server. The client-sent `total` is ignored.
- **Input validation** with Joi (`stripUnknown`) on every write endpoint, plus Mongoose schema validation. Unknown keys and operator-shaped payloads (`{"$gt": ""}`) are rejected or stripped.
- **No sensitive data leaks:** password hash and refresh tokens are `select: false` and removed in `toJSON`; public owner info is limited to name/phone/location.
- **Login hardening:** bcrypt cost 12, constant-shape error message, dummy-hash compare for unknown emails (prevents user enumeration by timing), rate limit 20 req / 15 min per IP on login/register.
- **HTTP hardening:** Helmet headers, CORS allow-list (`CORS_ORIGIN`) instead of `*`, 100 kB body limit, `x-powered-by` disabled, central error handler that never returns stack traces.
- **Cron endpoint** protected with `CRON_SECRET` using a timing-safe comparison.

## Concurrency & reliability

| Risk | Mitigation |
| --- | --- |
| Double booking the same slot (two users click at the same time) | Unique partial index `{ idField, startAt }` where `active: true`; the loser gets `409`. Cancelling frees the slot. |
| Double payment / double-click on "Pay" | Status CAS `Menunggu Pembayaran → Menunggu Konfirmasi`; only one request wins. |
| Negative balance (lost update on `saldo -= x`) | Atomic `$inc` guarded by `saldo: { $gte: total }`. |
| Owner credited twice | Status CAS `Menunggu Konfirmasi → Dikonfirmasi` before `$inc`. |
| Refund twice / refund an unpaid order | Cancel is a CAS from `[unpaid, paid]`; refund only if the previous status was `paid`. |
| Partial failure between status change and balance update | Multi-document transaction when MongoDB runs as a replica set (Atlas does); on a standalone server the code falls back to a compensating update. |
| Duplicate random IDs | `crypto.randomInt` + unique index + retry on collision (instead of check-then-insert). |
| Overlapping cron runs | In-process guard + idempotent `updateMany` on `endAt <= now`. |
| N+1 queries on history / owner dashboard | Batched `$in` lookups + `Map` joins; indexes on all lookup fields; `.lean()` for read paths. |
| Request hangs on unhandled async errors | `asyncHandler` wrapper + central error handler; missing documents return `404` instead of crashing. |
| Serverless cold starts opening many connections | Cached connection promise, `maxPoolSize: 10`. |

`test/integration.test.js` fires concurrent requests (10 bookings on one slot, 10 payments, 5 accepts, 5 cancels) and asserts the balances and states end up correct. It passes against both a standalone MongoDB and a single-node replica set.

## Running locally

```bash
cp .env.example .env          # fill in secrets (min. 32 random chars each)
npm install
npm run dev                   # http://localhost:8000
```

```bash
npm test                      # unit tests
docker run -d --rm -p 27017:27017 --name mongo mongo:7
TEST_MONGODB_URI=mongodb://127.0.0.1:27017/dibooking_test npm test   # + integration tests
npm run lint
```

On Vercel, set the same env vars plus `CRON_SECRET`; `vercel.json` schedules the status-update cron hourly.

## Known limitations

- Slot dates are sent as `"Monday, November 24"` (no year, as produced by the client); the server infers the year in WIB and rejects past slots. A future API version should accept ISO-8601.
- Rate limiting is in-memory, i.e. per serverless instance. Use a shared store (Redis) for strict limits.
- Top-up has no payment gateway; it exists for demo purposes.
