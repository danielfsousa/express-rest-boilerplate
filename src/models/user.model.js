import { ObjectId } from 'mongodb'
import mongoose from 'mongoose'

const roles = ['user', 'admin']

const schema = new mongoose.Schema(
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
      minlength: 8,
      maxlength: 500,
    },
    name: {
      type: String,
      required: true,
      maxlength: 500,
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
    photoUrl: {
      type: String,
      trim: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

class UserClass {
  constructor({ name, email, role, photoUrl, createdAt, updatedAt }) {
    this._id = new ObjectId()
    this.emailVerified = false
    this.name = name
    this.email = email
    this.role = role
    this.photoUrl = photoUrl
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }

  format() {
    return {
      type: 'users',
      id: this._id,
      name: this.name,
      email: this.email,
      role: this.role,
      photoUrl: this.photoUrl,
      emailVerified: this.emailVerified,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}

schema.index({ createdAt: -1 })
schema.loadClass(UserClass)
const User = mongoose.model('User', schema)

export default User
