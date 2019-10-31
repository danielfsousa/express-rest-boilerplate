const mongoose = require('mongoose');
const crypto = require('crypto');
const moment = require('moment-timezone');

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
});

passwordResetTokenSchema.statics = {
  /**
   * Generate a refresh token object and saves it into the database
   *
   * @param {User} user
   * @returns {RefreshToken}
   */
  generate(user) {
    const userId = user._id;
    const userEmail = user.email;
    const resetToken = `${userId}.${crypto.randomBytes(40).toString('hex')}`;
    const expires = moment()
      .add(2, 'hours')
      .toDate();
    const resetTokenObject = new passwordResetToken({
      resetToken,
      userId,
      userEmail,
      expires,
    });
    resetTokenObject.save();
    return resetTokenObject;
  },
};

/**
 * @typedef RefreshToken
 */
const PasswordResetToken = mongoose.model('passwordResetToken', passwordResetTokenSchema);
module.exports = PasswordResetToken;
