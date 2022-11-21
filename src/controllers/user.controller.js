import httpStatus from 'http-status'
import * as userRepository from '#repositories/user'
import * as userService from '#services/user'

export async function get(req, res) {
  const user = await userService.getById(req.params.userId)
  res.json({ data: user })
}

export function getCurrent(req, res) {
  const user = req.user.format()
  res.json({ data: user })
}

export async function update(req, res) {
  const user = await userService.updateById(req.params.userId, req.body)
  res.json({ data: user })
}

export async function list(req, res) {
  const { users, nextToken } = await userRepository.findMany(req.query)
  const data = users.map(user => user.format())
  res.json({ nextToken, data })
}

export async function remove(req, res) {
  await userService.deleteById(req.params.userId)
  res.sendStatus(httpStatus.NO_CONTENT)
}
