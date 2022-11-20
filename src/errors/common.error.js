import httpStatus from 'http-status'

export class APIError extends Error {
  constructor({ type, title, detail, status = httpStatus.INTERNAL_SERVER_ERROR }) {
    super(title)
    this.type = type
    this.title = title
    this.detail = detail
    this.status = status
  }
}

export class ValidationError extends APIError {
  constructor({ invalidParams, ...rest }) {
    // @ts-ignore
    super(rest)
    this.invalidParams = invalidParams
  }
}
