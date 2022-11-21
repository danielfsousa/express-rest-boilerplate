import httpStatus from 'http-status'
import { APIError } from '#errors/common'

export class IncorrectEmailOrPasswordError extends APIError {
  constructor(originalError) {
    super({
      type: 'auth/incorrect_credentials',
      title: 'Incorrect email or password',
      status: httpStatus.UNAUTHORIZED,
      cause: originalError,
    })
  }
}
