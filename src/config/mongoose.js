const mongoose = require('mongoose');
const { logger } = require('../api/utils/logger');
const config = require('./');

// set mongoose Promise to Bluebird
mongoose.Promise = Promise;

/**
* @private
*/
const mongoUri = config.mongo.uri;

// Exit application on error
mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error: ${err}`);
  process.exit(-1);
});

// print mongoose logs in dev env
if (config.env === 'development') {
  mongoose.set('debug', true);
}

/**
* Connect to mongo db
*
* @returns {object} Mongoose connection
* @public
*/
exports.connect = () => {
  mongoose.connect(mongoUri, {
    keepAlive: 1,
    useMongoClient: true,
  });
  return mongoose.connection;
};
