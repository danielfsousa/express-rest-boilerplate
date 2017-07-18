// make bluebird default Promise
Promise = require('bluebird'); // eslint-disable-line no-global-assign

const config = require('./config');
const app = require('./config/express');
const mongoose = require('./config/mongoose');

// open mongoose connection
mongoose.connect();

app.listen(config.port, () => {
  console.info(`server started on port ${config.port} (${config.env})`);
});

/**
* Exports express
* @public
*/
module.exports = app;
