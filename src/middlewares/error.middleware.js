import expressValidation from 'express-validation'
import httpStatus from 'http-status'
import config from '#config'
import APIError from '#errors/api'

// TODO: refactor error handling

/**
 * Error handler. Send stacktrace only during development
 */
export function handler(err, req, res, next) {
  const response = {
    code: err.status,
    message: err.message || httpStatus[err.status],
    errors: err.errors,
    stack: err.stack,
  }

  if (config.env !== 'development') {
    delete response.stack
  }

  res.status(err.status)
  res.json(response)
}

/**
 * If error is not an instanceOf APIError, convert it.
 * @public
 */
export function converter(err, req, res, next) {
  let convertedError = err

  if (err instanceof expressValidation.ValidationError) {
    convertedError = new APIError({
      message: 'Validation Error',
      errors: err.errors,
      status: err.status,
      stack: err.stack,
    })
  } else if (!(err instanceof APIError)) {
    convertedError = new APIError({
      message: err.message,
      status: err.status,
      stack: err.stack,
    })
  }

  return handler(convertedError, req, res)
}

/**
 * Catch 404 and forward to error handler
 * @public
 */
export function notFound(req, res, next) {
  const err = new APIError({
    message: 'Not found',
    status: httpStatus.NOT_FOUND,
  })
  return handler(err, req, res)
}
