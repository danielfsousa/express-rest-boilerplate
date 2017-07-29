const fs = require('fs');
const path = require('path');
const winston = require('winston');
const moment = require('moment-timezone');

/**
* Logs' directory
* @private
*/
const dir = path.join(__dirname, '../../logs');

// Create the directory if it does not exist
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

/**
* Return Date timestamp
* @private
*/
function timestamp() {
  return moment().tz('America/Sao_Paulo').format('DD/MM/YYYY HH:mm:ss Z');
}

/**
* Standard Apache combined log output without Date
* (Winston already logs the date and time)
* @private
*/
const combinedWithoutDate = ':remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';

/**
* Export configuration
* @public
*/
exports.logs = {
  dir,
  morgan: process.env.NODE_ENV === 'production' ? combinedWithoutDate : 'dev',
  winston: {
    transports: [
      new winston.transports.File({
        name: 'file.errors',
        level: 'error',
        filename: path.join(dir, 'errors.log'),
        handleExceptions: true,
        json: false,
        maxsize: 5242880, // 5MB
        maxFiles: 10,
        colorize: false,
        timestamp,
      }),
      new winston.transports.File({
        name: 'file.all',
        level: 'info',
        filename: path.join(dir, 'all.log'),
        handleExceptions: false,
        json: false,
        maxsize: 5242880, // 5MB
        maxFiles: 10,
        colorize: false,
        timestamp,
      }),
      new winston.transports.Console({
        level: process.env.NODE_ENV === 'debug',
        handleExceptions: true,
        colorize: true,
        humanReadableUnhandledException: true,
      }),
    ],
    exitOnError: false,
  },
};
