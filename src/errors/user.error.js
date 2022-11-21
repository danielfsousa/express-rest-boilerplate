import httpStatus from 'http-status'
import { APIError } from '#errors/common'

export class UserNotFoundError extends APIError {
  constructor(originalError) {
    super({
      type: 'user/not_found',
      title: 'User not found',
      status: httpStatus.NOT_FOUND,
      cause: originalError,
    })
  }
}

export class EmailAlreadyExistsError extends APIError {
  constructor(originalError) {
    super({
      type: 'user/invalid_email',
      title: '"email" already exists',
      status: httpStatus.CONFLICT,
      cause: originalError,
    })
  }
}
