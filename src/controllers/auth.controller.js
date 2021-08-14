import httpStatus from 'http-status'
import moment from 'moment-timezone'
import { omit } from 'lodash-es'

import config from '#config'
import User from '#models/user'
import RefreshToken from '#models/refresh-token'
import PasswordResetToken from '#models/password-reset-token'
import APIError from '#errors/api'
import * as emailProvider from '#services/email-provider'

function generateTokenResponse(user, accessToken) {
  const tokenType = 'Bearer'
  const refreshToken = RefreshToken.generate(user).token
  const expiresIn = moment().add(config.jwtExpirationInterval, 'minutes')
  return { tokenType, accessToken, refreshToken, expiresIn }
}

export async function register(req, res, next) {
  try {
    const userData = omit(req.body, 'role')
    const user = await new User(userData).save()
    const userTransformed = user.transform()
    const token = generateTokenResponse(user, user.token())
    res.status(httpStatus.CREATED)
    return res.json({ token, user: userTransformed })
  } catch (error) {
    return next(User.checkDuplicateEmail(error))
  }
}

export async function login(req, res, next) {
  try {
    const { user, accessToken } = await User.findAndGenerateToken(req.body)
    const token = generateTokenResponse(user, accessToken)
    const userTransformed = user.transform()
    return res.json({ token, user: userTransformed })
  } catch (error) {
    return next(error)
  }
}

/**
 * login with an existing user or creates a new one if valid accessToken token
 * Returns jwt token
 * @public
 */
export async function oAuth(req, res, next) {
  try {
    const { user } = req
    const accessToken = user.token()
    const token = generateTokenResponse(user, accessToken)
    const userTransformed = user.transform()
    return res.json({ token, user: userTransformed })
  } catch (error) {
    return next(error)
  }
}

/**
 * Returns a new jwt when given a valid refresh token
 * @public
 */
export async function refresh(req, res, next) {
  try {
    const { email, refreshToken } = req.body
    const refreshObject = await RefreshToken.findOneAndRemove({
      userEmail: email,
      token: refreshToken,
    })
    const { user, accessToken } = await User.findAndGenerateToken({ email, refreshObject })
    const response = generateTokenResponse(user, accessToken)
    return res.json(response)
  } catch (error) {
    return next(error)
  }
}

export async function sendPasswordReset(req, res, next) {
  try {
    const { email } = req.body
    const user = await User.findOne({ email }).exec()

    if (user) {
      const passwordResetObj = await PasswordResetToken.generate(user)
      emailProvider.sendPasswordReset(passwordResetObj)
      res.status(httpStatus.OK)
      return res.json('success')
    }
    throw new APIError({
      status: httpStatus.UNAUTHORIZED,
      message: 'No account found with that email',
    })
  } catch (error) {
    return next(error)
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { email, password, resetToken } = req.body
    const resetTokenObject = await PasswordResetToken.findOneAndRemove({
      userEmail: email,
      resetToken,
    })

    const err = {
      status: httpStatus.UNAUTHORIZED,
      isPublic: true,
    }
    if (!resetTokenObject) {
      err.message = 'Cannot find matching reset token'
      throw new APIError(err)
    }
    if (moment().isAfter(resetTokenObject.expires)) {
      err.message = 'Reset token is expired'
      throw new APIError(err)
    }

    const user = await User.findOne({ email: resetTokenObject.userEmail }).exec()
    user.password = password
    await user.save()
    emailProvider.sendPasswordChangeEmail(user)

    res.status(httpStatus.OK)
    return res.json('Password Updated')
  } catch (error) {
    return next(error)
  }
}
