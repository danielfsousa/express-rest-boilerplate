const httpStatus = require('http-status');
const expressValidation = require('express-validation');
const APIError = require('../utils/APIError');
const config = require('../../config');

/**
 * Error handler. Send stacktrace only during development
 * @public
 */
const handler = (err, req, res, next) => {
  const response = {
    code: err.status,
    message: err.message,
    errors: err.errors,
    stack: err.stack,
  };

  if (config.env === 'production') {
    delete response.stack;
    response.message = err.isPublic ? err.message : httpStatus[err.status];
  }

  res.status(err.status);
  res.json(response);
  res.end();
};
exports.handler = handler;

/**
 * If error is not an instanceOf APIError, convert it.
 * @public
 */
exports.converter = (err, req, res, next) => {
  if (err instanceof expressValidation.ValidationError) {
    const error = new APIError({
      message: 'Validation Error',
      errors: err.errors,
      status: err.status,
      isPublic: true,
      stack: err.stack,
    });
    handler(error, req, res);
  } else if (!(err instanceof APIError)) {
    const error = new APIError({
      message: err.message,
      status: err.status,
      isPublic: err.isPublic,
      stack: err.stack,
    });
    return handler(error, req, res);
  }
  return handler(err, req, res);
};

/**
 * Catch 404 and forward to error handler
 * @public
 */
exports.notFound = (req, res, next) => {
  const err = new APIError({
    message: 'Not found',
    status: httpStatus.NOT_FOUND,
  });
  return handler(err, req, res);
};
