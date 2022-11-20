import { ObjectId } from 'mongodb'
import User from '#models/user'

export async function findById(id) {
  const model = await User.findById(id).exec()
  return model?.toObject()
}

export async function findByEmail(email) {
  const model = await User.findOne({ email }).exec()
  return model?.toObject()
}

export async function findMany({ after, role, limit = 50 }) {
  const filters = { role }

  const users = await User.find({
    ...(after && { _id: { $lt: new ObjectId(after) } }),
    ...filters,
  })
    .sort({ _id: -1 })
    .limit(limit)
    .exec()

  const lastId = users[users.length - 1]?._id

  const hasNext =
    users.length === limit &&
    !!(await User.findOne(
      {
        _id: { $lt: lastId },
        ...filters,
      },
      { fields: ['_id'] }
    ))

  const nextToken = hasNext ? lastId : null

  return { users, nextToken }
}

export async function create(params) {
  const model = await User.create(params)
  return model.toObject()
}

export async function update(id, params) {
  const model = await User.updateOne({ _id: id }, params).exec()
  return model?.toObject()
}
