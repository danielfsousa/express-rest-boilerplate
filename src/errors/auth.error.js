import httpStatus from 'http-status'
import { APIError } from '#errors/common'

export class IncorrectEmailOrPasswordError extends APIError {
  message = 'Incorrect email or password'
  status = httpStatus.UNAUTHORIZED
}
