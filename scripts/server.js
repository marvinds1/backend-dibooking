/* eslint-disable no-console */
const cron = require('node-cron');
const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config/env');
const { connect } = require('./config/db');
const updateStatus = require('./utils/updateStatus');

module.exports = app;

if (require.main === module) {
  connect()
    .then(() => {
      const server = app.listen(config.port, () => console.log(`Server running on port ${config.port}`));
      server.requestTimeout = 60000;

      const job = cron.schedule('*/10 * * * *', () => {
        updateStatus().catch((err) => console.error('updateStatus failed', err));
      });

      const shutdown = () => {
        job.stop();
        server.close(() => mongoose.disconnect().finally(() => process.exit(0)));
      };
      process.on('SIGTERM', shutdown);
      process.on('SIGINT', shutdown);
    })
    .catch((err) => {
      console.error('Cannot connect to the database', err);
      process.exit(1);
    });
}
