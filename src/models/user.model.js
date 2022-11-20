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

class UserClass {
  _id
  name
  role
  picture
  createdAt
  format() {
    return {
      type: 'users',
      id: this._id,
      name: this.name,
      role: this.role,
      photoUrl: this.picture,
      createdAt: this.createdAt,
    }
  }
}

schema.index({ createdAt: -1 })
schema.loadClass(UserClass)
const User = mongoose.model('User', schema)

export default User
