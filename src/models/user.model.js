import bcrypt from 'bcryptjs'
import { addMinutes, getUnixTime, isBefore } from 'date-fns'
import httpStatus from 'http-status'
import jwt from 'jwt-simple'
import { isNil, omitBy } from 'lodash-es'
import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import config from '#config'
import APIError from '#errors/api'

const { env, jwtSecret, jwtExpirationInterval } = config
const roles = ['user', 'admin']

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      match: /^\S+@\S+\.\S+$/,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      maxlength: 128,
    },
    name: {
      type: String,
      maxlength: 128,
      index: true,
      trim: true,
    },
    services: {
      facebook: String,
      google: String,
    },
    role: {
      type: String,
      enum: roles,
      default: 'user',
    },
    picture: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

userSchema.pre('save', async function save(next) {
  try {
    if (!this.isModified('password')) return next()

    const rounds = env === 'test' ? 1 : 10

    const hash = await bcrypt.hash(this.password, rounds)
    this.password = hash

    return next()
  } catch (error) {
    return next(error)
  }
})

userSchema.method({
  transform() {
    const transformed = {}
    const fields = ['id', 'name', 'email', 'picture', 'role', 'createdAt']

    fields.forEach(field => {
      transformed[field] = this[field]
    })

    return transformed
  },

  token() {
    const payload = {
      exp: getUnixTime(addMinutes(Date.now(), jwtExpirationInterval)),
      iat: getUnixTime(Date.now()),
      sub: this._id,
    }
    return jwt.encode(payload, jwtSecret)
  },

  async passwordMatches(password) {
    return bcrypt.compare(password, this.password)
  },
})

userSchema.statics = {
  roles,

  /**
   * Get user
   *
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<User, APIError>}
   */
  async get(id) {
    let user

    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await this.findById(id).exec()
    }
    if (user) {
      return user
    }

    throw new APIError({
      message: 'User does not exist',
      status: httpStatus.NOT_FOUND,
    })
  },

  /**
   * Find user by email and tries to generate a JWT token
   *
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<User, APIError>}
   */
  async findAndGenerateToken(options) {
    const { email, password, refreshObject } = options
    if (!email) throw new APIError({ message: 'An email is required to generate a token' })

    const user = await this.findOne({ email }).exec()
    const err = {
      status: httpStatus.UNAUTHORIZED,
      isPublic: true,
    }
    if (password) {
      if (user && (await user.passwordMatches(password))) {
        return { user, accessToken: user.token() }
      }
      err.message = 'Incorrect email or password'
    } else if (refreshObject && refreshObject.userEmail === email) {
      if (isBefore(refreshObject.expires, Date.now())) {
        err.message = 'Invalid refresh token.'
      } else {
        return { user, accessToken: user.token() }
      }
    } else {
      err.message = 'Incorrect email or refreshToken'
    }
    throw new APIError(err)
  },

  /**
   * List users in descending order of 'createdAt' timestamp.
   *
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<User[]>}
   */
  list({ page = 1, perPage = 30, name, email, role }) {
    const options = omitBy({ name, email, role }, isNil)

    return this.find(options)
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .exec()
  },

  /**
   * Return new validation error
   * if error is a mongoose duplicate key error
   *
   * @param {Error} error
   * @returns {Error|APIError}
   */
  checkDuplicateEmail(error) {
    if (error.name === 'MongoError' && error.code === 11000) {
      return new APIError({
        message: 'Validation Error',
        errors: [
          {
            field: 'email',
            location: 'body',
            messages: ['"email" already exists'],
          },
        ],
        status: httpStatus.CONFLICT,
        isPublic: true,
        stack: error.stack,
      })
    }
    return error
  },

  async oAuthLogin({ service, id, email, name, picture }) {
    const user = await this.findOne({ $or: [{ [`services.${service}`]: id }, { email }] })
    if (user) {
      user.services[service] = id
      if (!user.name) user.name = name
      if (!user.picture) user.picture = picture
      return user.save()
    }
    const password = uuidv4()
    return this.create({
      services: { [service]: id },
      email,
      password,
      name,
      picture,
    })
  },
}

export default mongoose.model('User', userSchema)
