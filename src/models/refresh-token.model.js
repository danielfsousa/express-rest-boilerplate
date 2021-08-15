import crypto from 'crypto'
// TODO: use date-fns or temporal
import moment from 'moment-timezone'
import mongoose from 'mongoose'

/**
 * Refresh Token Schema
 * @private
 */
const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userEmail: {
    type: 'String',
    ref: 'User',
    required: true,
  },
  expires: { type: Date },
})

refreshTokenSchema.statics = {
  /**
   * Generate a refresh token object and saves it into the database
   *
   * @param {User} user
   * @returns {RefreshToken}
   */
  generate(user) {
    const userId = user._id
    const userEmail = user.email
    const token = `${userId}.${crypto.randomBytes(40).toString('hex')}`
    const expires = moment().add(30, 'days').toDate()
    const tokenObject = new RefreshToken({
      token,
      userId,
      userEmail,
      expires,
    })
    tokenObject.save()
    return tokenObject
  },
}

/**
 * @typedef RefreshToken
 */
const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema)

export default RefreshToken
