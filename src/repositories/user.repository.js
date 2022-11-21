import { ObjectId } from 'mongodb'
import User from '#models/user'

export async function findById(id) {
  return await User.findById(id).exec()
}

export async function findByEmail(email) {
  return await User.findOne({ email }).exec()
}

export async function findMany({ after, role, orderBy = 'asc', limit = 50 }) {
  const sort = orderBy === 'asc' ? 1 : -1
  const condition = orderBy === 'asc' ? '$gt' : '$lt'
  const filters = {
    ...(role && { role }),
  }

  const users = await User.find({
    ...(after && { _id: { [condition]: new ObjectId(after) } }),
    ...filters,
  })
    .sort({ _id: sort })
    .limit(limit)
    .exec()

  const lastId = users[users.length - 1]?._id

  const hasNext =
    users.length === limit &&
    !!(await User.findOne(
      {
        _id: { [condition]: lastId },
        ...filters,
      },
      { fields: ['_id'] }
    ))

  const nextToken = hasNext ? lastId : null

  return { users, nextToken }
}

export async function create(params) {
  return await User.create(params)
}

export async function update(id, params) {
  return await User.findOneAndUpdate({ _id: id }, params, { new: true }).exec()
}

export async function deleteById(id) {
  return await User.deleteOne({ _id: id }).exec()
}
