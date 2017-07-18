const path = require('path');

// import .env variables
require('dotenv-safe').load({
  path: path.join(__dirname, '../../.env'),
  sample: path.join(__dirname, '../../.env.example'),
});

// load config files
const app = require('./app');
const logs = require('./logs');
const jwtStrategy = require('./passport').jwtStrategy;

/**
* Exports combined configuration
* @public
*/
module.exports = Object.assign({}, app, logs, jwtStrategy);
