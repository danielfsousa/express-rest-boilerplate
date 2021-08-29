import httpStatus from 'http-status'
import config from '#config'
import APIError from '#errors/api'
import logger from '#lib/logger'

export function notFoundErrorHandler(req, res, next) {
  const err = new APIError({
    message: 'Not found',
    status: httpStatus.NOT_FOUND,
  })

  return catchAllErrorHandler(err, req, res, next)
}

export function genericErrorHandler(err, req, res, next) {
  const convertedError = !(err instanceof APIError)
    ? new APIError({
        message: err.message,
        status: err.status,
        stack: err.stack,
      })
    : err

  return catchAllErrorHandler(convertedError, req, res, next)
}

export function catchAllErrorHandler(err, req, res, next) {
  logger.error({ err, msg: 'caught api error' })

  const { message, errors, stack, status = 500 } = err
  const response = {
    code: status,
    message: message ?? httpStatus[status],
    errors,
  }

  if (!config.isProduction) {
    response.stack = stack
  }

  res.status(status).json(response)
}
