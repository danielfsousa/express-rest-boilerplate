import httpStatus from 'http-status'

export class APIError extends Error {
  constructor(options) {
    const { type, title, detail, cause, status = httpStatus.INTERNAL_SERVER_ERROR } = options
    super(title, { cause })
    this.type = type
    this.title = title
    this.detail = detail
    this.status = status
  }
}

export class ValidationError extends APIError {
  constructor(options) {
    const { invalidParams, ...rest } = options
    super(rest)
    this.invalidParams = invalidParams
  }
}
