import crypto from 'crypto'
import moment from 'moment-timezone'
import mongoose from 'mongoose'

/**
 * Refresh Token Schema
 * @private
 */
const passwordResetTokenSchema = new mongoose.Schema({
  resetToken: {
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

passwordResetTokenSchema.statics = {
  /**
   * Generate a reset token object and saves it into the database
   *
   * @param {User} user
   * @returns {ResetToken}
   */
  async generate(user) {
    const userId = user._id
    const userEmail = user.email
    const resetToken = `${userId}.${crypto.randomBytes(40).toString('hex')}`
    const expires = moment().add(2, 'hours').toDate()
    const ResetTokenObject = new PasswordResetToken({
      resetToken,
      userId,
      userEmail,
      expires,
    })
    await ResetTokenObject.save()
    return ResetTokenObject
  },
}

const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema)

export default PasswordResetToken
