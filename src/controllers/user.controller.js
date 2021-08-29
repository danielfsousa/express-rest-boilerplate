import httpStatus from 'http-status'
import { omit } from 'lodash-es'
import User from '#models/user'

export async function load(req, res, next, id) {
  const user = await User.get(id)
  req.locals = { user }
  return next()
}

export function get(req, res) {
  res.json(req.locals.user.transform())
}

export function loggedIn(req, res) {
  res.json(req.user.transform())
}

export async function create(req, res, next) {
  try {
    const user = new User(req.body)
    const savedUser = await user.save()
    res.status(httpStatus.CREATED)
    res.json(savedUser.transform())
  } catch (error) {
    next(User.checkDuplicateEmail(error))
  }
}

export async function replace(req, res, next) {
  try {
    const { user } = req.locals
    const newUser = new User(req.body)
    const ommitRole = user.role !== 'admin' ? 'role' : ''
    const newUserObject = omit(newUser.toObject(), '_id', ommitRole)

    await user.updateOne(newUserObject, { override: true, upsert: true })
    const savedUser = await User.findById(user._id)

    res.json(savedUser.transform())
  } catch (error) {
    next(User.checkDuplicateEmail(error))
  }
}

export async function update(req, res, next) {
  const ommitRole = req.locals.user.role !== 'admin' ? 'role' : ''
  const updatedUser = omit(req.body, ommitRole)
  const user = Object.assign(req.locals.user, updatedUser)

  try {
    const updatedUser = await user.save()
    res.json(updatedUser.transform())
  } catch (e) {
    next(User.checkDuplicateEmail(e))
  }
}

export async function list(req, res, next) {
  const users = await User.list(req.query)
  const transformedUsers = users.map(user => user.transform())
  res.json(transformedUsers)
}

export async function remove(req, res, next) {
  const { user } = req.locals
  await user.remove()
  res.sendStatus(httpStatus.NO_CONTENT)
}
