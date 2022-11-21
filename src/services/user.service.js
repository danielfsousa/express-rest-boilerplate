import { UserNotFoundError } from '#errors/user'
import * as userRepository from '#repositories/user'

export async function getById(id) {
  try {
    const user = await userRepository.findById(id)
    if (!user) throw new UserNotFoundError()
    return user.format()
  } catch (err) {
    if (err.name === 'CastError') throw new UserNotFoundError(err)
    else throw err
  }
}

export async function updateById(id, params) {
  try {
    // TODO: check if user can be updated by
    // TODO: check if user can update user.role
    const user = await userRepository.update(id, params)
    if (!user) throw new UserNotFoundError()
    return user.format()
  } catch (err) {
    if (err.name === 'CastError') throw new UserNotFoundError(err)
    else throw err
  }
}

export async function deleteById(id) {
  try {
    const { deletedCount } = await userRepository.deleteById(id)
    if (!deletedCount) throw new UserNotFoundError()
  } catch (err) {
    if (err.name === 'CastError') throw new UserNotFoundError(err)
    else throw err
  }
}
