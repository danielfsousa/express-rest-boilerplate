import httpStatus from 'http-status'
import { EmailAlreadyExistsError, UserNotFoundError } from '#errors/user'
import * as userRepository from '#repositories/user'

export async function get(req, res) {
  const user = await userRepository.findById(req.params.id)
  if (!user) {
    throw new UserNotFoundError()
  }
  res.json(user.format())
}

export function getCurrent(req, res) {
  res.json(req.user.format())
}

export async function update(req, res) {
  try {
    // TODO: check if user can be updated by
    // TODO: check if user can update user.role
    const { user, modifiedCount } = await userRepository.update(req.params.id, req.body)
    if (!modifiedCount) {
      throw new UserNotFoundError()
    }
    res.json(user.format())
  } catch (err) {
    if (err.name === 'MongoError' && err.code === 11000) {
      throw new EmailAlreadyExistsError()
    }
    throw err
  }
}

export async function list(req, res) {
  const { users, nextToken } = await userRepository.findMany(req.query)
  const data = users.map(user => user.format())
  res.json({ nextToken, data })
}

export async function remove(req, res) {
  const modifiedCount = await userRepository.delete(req.params.id)
  if (!modifiedCount) {
    throw new UserNotFoundError()
  }
  res.sendStatus(httpStatus.NO_CONTENT)
}
