import httpStatus from 'http-status'
import { APIError } from '#errors/common'

export class UserNotFoundError extends APIError {
  message = 'User not found'
  status = httpStatus.NOT_FOUND
}

export class EmailAlreadyExistsError extends APIError {
  message = '"email" already exists'
  status = httpStatus.CONFLICT
  errors = [
    {
      field: 'email',
      location: 'body',
      messages: ['"email" already exists'],
    },
  ]
}
