import httpStatus from 'http-status'
import * as authService from '#services/auth'

export async function signUp(req, res) {
  const { user, ...tokens } = await authService.signUp(req.body)
  res.status(httpStatus.CREATED).json({ data: user.format(), ...tokens })
}

export async function login(req, res) {
  const { email, password } = req.body
  const { user, ...tokens } = await authService.logInWithEmailAndPassword(email, password)
  res.json({ data: user.format(), ...tokens })
}

export async function oAuth(req, res) {
  const { user } = req
  const tokens = await authService.loginWithOAuth(user)
  res.json({ user: user.format(), ...tokens })
}

export async function sendPasswordReset(req, res) {
  await authService.sendPasswordReset(req.body.email)
  res.json({ message: 'Password reset will be sent if email exists' })
}

export async function resetPassword(req, res) {
  const { email, newPassword, token } = req.body
  await authService.resetPassword(email, newPassword, token)
  res.json({ message: 'password changed' })
}
