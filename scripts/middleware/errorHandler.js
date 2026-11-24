/* eslint-disable no-console */
module.exports = (err, req, res, next) => {
  if (err.status) return res.status(err.status).json({ message: err.message });
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ message: err.message });
  }
  if (err.code === 11000) return res.status(409).json({ message: 'Data sudah ada' });
  if (err.type === 'entity.too.large') return res.status(413).json({ message: 'Payload too large' });
  console.error(err);
  return res.status(500).json({ message: 'Internal server error' });
};
