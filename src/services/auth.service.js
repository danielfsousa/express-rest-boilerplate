import bcrypt from 'bcryptjs'
import { addDays, addMinutes, getUnixTime } from 'date-fns'
import jwt from 'jwt-simple'
import config from '#config'
import { IncorrectEmailOrPasswordError } from '#errors/auth'
import { EmailAlreadyExistsError } from '#errors/user'
import * as userRepository from '#repositories/user'

export const TOKEN_TYPE = 'Bearer'

export async function signUp(userParams) {
  try {
    const passwordHash = await bcrypt.hash(userParams.password, 10)
    const user = await userRepository.create({ ...userParams, password: passwordHash })
    const accessToken = createAccessToken(user)
    const refreshToken = createRefreshToken(user)
    return { user, accessToken, refreshToken }
  } catch (err) {
    if (err.message.includes('duplicate key error')) {
      throw new EmailAlreadyExistsError()
    }
    throw err
  }
}

export async function logInWithEmailAndPassword(email, password) {
  const user = await userRepository.findByEmail(email)
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new IncorrectEmailOrPasswordError()
  }
  const accessToken = createAccessToken(user)
  const refreshToken = await createRefreshToken(user)
  return { user, accessToken, refreshToken }
}

export async function loginWithOAuth(user) {
  const accessToken = createAccessToken(user)
  const refreshToken = await createRefreshToken(user)
  return { accessToken, refreshToken }
}

export async function loginWithOAuth_test({ service, id, email, name, picture }) {
  const user = await this.findOne({ $or: [{ [`services.${service}`]: id }, { email }] })
  if (user) {
    user.services[service] = id
    if (!user.name) user.name = name
    if (!user.picture) user.picture = picture
    return user.save()
  }
  const password = randomUUID()
  return this.create({
    services: { [service]: id },
    email,
    password,
    name,
    picture,
  })
}

export async function sendPasswordReset(email) {
  console.log(email)
  // if (!user) return
  // await userRepository.findByEmail(email)
  // const passwordResetObj = await PasswordResetToken.generate(user)
  // emailProvider.sendPasswordReset(passwordResetObj)
}

export async function resetPassword(email, newPassword, token) {
  console.log(email, newPassword, token)
  // const resetTokenObject = await PasswordResetToken.findOneAndRemove({
  //   userEmail: email,
  //   resetToken,
  // })
  // const err = {
  //   status: httpStatus.UNAUTHORIZED,
  //   isPublic: true,
  // }
  // if (!resetTokenObject) {
  //   err.message = 'Cannot find matching reset token'
  //   throw new APIError(err)
  // }
  // if (isAfter(Date.now(), resetTokenObject.expires)) {
  //   err.message = 'Reset token is expired'
  //   throw new APIError(err)
  // }
  // const user = await User.findOne({ email: resetTokenObject.userEmail }).exec()
  // user.password = password
  // await user.save()
  // emailProvider.sendPasswordChangeEmail(user)
}

export async function facebook(token) {
  const fields = 'id, name, email, picture'
  const searchParams = new URLSearchParams({ access_token: token, fields })
  const url = `https://graph.facebook.com/me?${searchParams}`
  const response = await fetch(url)
  const { id, name, email, picture } = await response.json()
  return {
    service: 'facebook',
    picture: picture.data.url,
    id,
    name,
    email,
  }
}

export async function google(token) {
  const searchParams = new URLSearchParams({ access_token: token })
  const url = `https://www.googleapis.com/oauth2/v3/userinfo?${searchParams}`
  const response = await fetch(url)
  const { sub, name, email, picture } = await response.json()
  return {
    service: 'google',
    picture,
    id: sub,
    name,
    email,
  }
}

function createAccessToken(user) {
  return {
    tokenType: TOKEN_TYPE,
    expiresIn: addMinutes(Date.now(), config.auth.jwtExpirationInterval),
    token: buildJWT(user._id),
  }
}

function createRefreshToken(user) {
  return {
    tokenType: TOKEN_TYPE,
    expiresIn: addDays(Date.now(), 30),
    token: buildJWT(user._id),
  }
}

function buildJWT(sub) {
  const payload = {
    exp: getUnixTime(addMinutes(Date.now(), config.auth.jwtExpirationInterval)),
    iat: getUnixTime(Date.now()),
    sub,
  }
  return jwt.encode(payload, config.auth.jwtSecret)
}
