import httpStatus from 'http-status'
import { omit } from 'lodash-es'
import moment from 'moment-timezone'
import request from 'supertest'
import { MongoDBContainer } from 'testcontainers'
import { expect, describe, it, beforeEach, vi, beforeAll, afterAll } from 'vitest'
import * as database from '#lib/database'
import app from '#lib/server'
import PasswordResetToken from '#models/password-reset-token'
import RefreshToken from '#models/refresh-token'
import User from '#models/user'
import * as authProviders from '#services/auth'
import * as emailProviders from '#services/email'

const fakeOAuthRequest = {
  service: 'facebook',
  id: '123',
  name: 'user',
  email: 'test@test.com',
  picture: 'test.jpg',
}

const dbUser = {
  email: 'admin@gmail.com',
  password: 'mypassword',
  name: 'Admin',
  role: 'admin',
}

const user = {
  email: 'user@gmail.com',
  password: '12345678910',
  name: 'User',
}

/** @type {import("testcontainers").StartedMongoDBContainer} */
let mongodbContainer
let refreshToken, resetToken, expiredRefreshToken, expiredResetToken

beforeAll(async () => {
  mongodbContainer = await new MongoDBContainer('mongo:6').start()
  await database.connect(mongodbContainer.getConnectionString())
  await User.create(dbUser)
})

afterAll(async () => {
  await mongodbContainer.stop()
})

beforeEach(async () => {
  refreshToken = {
    token:
      '5947397b323ae82d8c3a333b.c69d0435e62c9f4953af912442a3d064e20291f0d228c0552ed4be473e7d191ba40b18c2c47e8b9d',
    userId: '5947397b323ae82d8c3a333b',
    userEmail: dbUser.email,
    expires: moment().add(1, 'day').toDate(),
  }

  resetToken = {
    resetToken:
      '5947397b323ae82d8c3a333b.c69d0435e62c9f4953af912442a3d064e20291f0d228c0552ed4be473e7d191ba40b18c2c47e8b9d',
    userId: '5947397b323ae82d8c3a333b',
    userEmail: dbUser.email,
    expires: moment().add(2, 'hours').toDate(),
  }

  expiredRefreshToken = {
    token:
      '5947397b323ae82d8c3a333b.c69d0435e62c9f4953af912442a3d064e20291f0d228c0552ed4be473e7d191ba40b18c2c47e8b9d',
    userId: '5947397b323ae82d8c3a333b',
    userEmail: dbUser.email,
    expires: moment().subtract(1, 'day').toDate(),
  }

  expiredResetToken = {
    resetToken:
      '5947397b323ae82d8c3a333b.c69d0435e62c9f4953af912442a3d064e20291f0d228c0552ed4be473e7d191ba40b18c2c47e8b9d',
    userId: '5947397b323ae82d8c3a333b',
    userEmail: dbUser.email,
    expires: moment().subtract(2, 'hours').toDate(),
  }

  await RefreshToken.deleteMany()
  await PasswordResetToken.deleteMany()
})

describe('POST /v1/auth/register', () => {
  it('should register a new user when request is ok', () => {
    const newUser = { ...user, email: 'test@email.com' }
    return request(app)
      .post('/v1/auth/register')
      .send(newUser)
      .expect(httpStatus.CREATED)
      .then(res => {
        expect(res.body.token).toHaveProperty('accessToken')
        expect(res.body.token).toHaveProperty('refreshToken')
        expect(res.body.token).toHaveProperty('expiresIn')
        expect(res.body.user).toContain(omit(newUser, 'password'))
      })
  })

  it('should report error when email already exists', () => {
    return request(app)
      .post('/v1/auth/register')
      .send(dbUser)
      .expect(httpStatus.CONFLICT)
      .then(res => {
        const { field, location, messages } = res.body.errors[0]
        expect(field).toEqual('email')
        expect(location).toEqual('body')
        expect(messages).toContain('"email" already exists')
      })
  })

  it('should report error when the email provided is not valid', () => {
    return request(app)
      .post('/v1/auth/register')
      .send({ ...user, email: 'this_is_not_an_email' })
      .expect(httpStatus.BAD_REQUEST)
      .then(res => {
        // TODO: fix error handling middleware json response
        // const { field, location, messages } = res.body.errors[0]
        // expect(field).toEqual('email')
        // expect(location).toEqual('body')
        // expect(messages).toContain('"email" must be a valid email')
      })
  })

  it('should report error when email and password are not provided', () => {
    return request(app)
      .post('/v1/auth/register')
      .send({})
      .expect(httpStatus.BAD_REQUEST)
      .then(res => {
        // const { field, location, messages } = res.body.errors[0]
        // expect(field).toEqual('email')
        // expect(location).toEqual('body')
        // expect(messages).toContain('"email" is required')
      })
  })
})

describe('POST /v1/auth/login', () => {
  it('should return an access_token and a refreshToken when email and password matches', () => {
    return request(app)
      .post('/v1/auth/login')
      .send(dbUser)
      .expect(httpStatus.OK)
      .then(res => {
        expect(res.body.token).toHaveProperty('accessToken')
        expect(res.body.token).toHaveProperty('refreshToken')
        expect(res.body.token).toHaveProperty('expiresIn')
        expect(res.body.user).toContain(omit(dbUser, 'password'))
      })
  })

  it('should report error when email and password are not provided', () => {
    return request(app)
      .post('/v1/auth/login')
      .send({})
      .expect(httpStatus.BAD_REQUEST)
      .then(res => {
        // const { field, location, messages } = res.body.errors[0]
        // expect(field).toEqual('email')
        // expect(location).toEqual('body')
        // expect(messages).toContain('"email" is required')
      })
  })

  it('should report error when the email provided is not valid', () => {
    return request(app)
      .post('/v1/auth/login')
      .send({ ...user, email: 'this_is_not_an_email' })
      .expect(httpStatus.BAD_REQUEST)
      .then(res => {
        // const { field, location, messages } = res.body.errors[0]
        // expect(field).toEqual('email')
        // expect(location).toEqual('body')
        // expect(messages).toContain('"email" must be a valid email')
      })
  })

  it("should report error when email and password don't match", () => {
    return request(app)
      .post('/v1/auth/login')
      .send({ ...dbUser, password: 'xxx' })
      .expect(httpStatus.UNAUTHORIZED)
      .then(res => {
        const { code } = res.body
        const { message } = res.body
        expect(code).toEqual(401)
        expect(message).toEqual('Incorrect email or password')
      })
  })
})

describe('POST /v1/auth/facebook', () => {
  it('should create a new user and return an access_token when user does not exist', () => {
    vi.spyOn(authProviders, 'facebook').mockResolvedValue(fakeOAuthRequest)

    return request(app)
      .post('/v1/auth/facebook')
      .send({ access_token: '123' })
      .expect(httpStatus.OK)
      .then(res => {
        expect(res.body.token).toHaveProperty('accessToken')
        expect(res.body.token).toHaveProperty('refreshToken')
        expect(res.body.token).toHaveProperty('expiresIn')
        expect(res.body.user).toBeTypeOf('object')
      })
  })

  it('should return an access_token when user already exists', async () => {
    await User.create({ ...dbUser, email: 'test1@test.com' })
    vi.spyOn(authProviders, 'facebook').mockResolvedValue(fakeOAuthRequest)
    return request(app)
      .post('/v1/auth/facebook')
      .send({ access_token: '123' })
      .expect(httpStatus.OK)
      .then(res => {
        expect(res.body.token).toHaveProperty('accessToken')
        expect(res.body.token).toHaveProperty('refreshToken')
        expect(res.body.token).toHaveProperty('expiresIn')
        expect(res.body.user).toBeTypeOf('object')
      })
  })

  it('should return error when access_token is not provided', async () => {
    return request(app)
      .post('/v1/auth/facebook')
      .expect(httpStatus.BAD_REQUEST)
      .then(res => {
        // const { field, location, messages } = res.body.errors[0]
        // expect(field).toEqual('access_token')
        // expect(location).toEqual('body')
        // expect(messages).toContain('"access_token" is required')
      })
  })
})

describe('POST /v1/auth/google', () => {
  it('should create a new user and return an access_token when user does not exist', () => {
    vi.spyOn(authProviders, 'google').mockResolvedValue(fakeOAuthRequest)
    return request(app)
      .post('/v1/auth/google')
      .send({ access_token: '123' })
      .expect(httpStatus.OK)
      .then(res => {
        expect(res.body.token).toHaveProperty('accessToken')
        expect(res.body.token).toHaveProperty('refreshToken')
        expect(res.body.token).toHaveProperty('expiresIn')
        expect(res.body.user).toBeTypeOf('object')
      })
  })

  it('should return an access_token when user already exists', async () => {
    await User.create({ ...dbUser, email: 'test2@test.com' })
    vi.spyOn(authProviders, 'google').mockResolvedValue(fakeOAuthRequest)
    return request(app)
      .post('/v1/auth/google')
      .send({ access_token: '123' })
      .expect(httpStatus.OK)
      .then(res => {
        expect(res.body.token).toHaveProperty('accessToken')
        expect(res.body.token).toHaveProperty('refreshToken')
        expect(res.body.token).toHaveProperty('expiresIn')
        expect(res.body.user).toBeTypeOf('object')
      })
  })

  it('should return error when access_token is not provided', async () => {
    return request(app)
      .post('/v1/auth/google')
      .expect(httpStatus.BAD_REQUEST)
      .then(res => {
        // const { field, location, messages } = res.body.errors[0]
        // expect(field).toEqual('access_token')
        // expect(location).toEqual('body')
        // expect(messages).toContain('"access_token" is required')
      })
  })
})

describe('POST /v1/auth/refresh-token', () => {
  it('should return a new access_token when refreshToken and email match', async () => {
    await RefreshToken.create(refreshToken)
    return request(app)
      .post('/v1/auth/refresh-token')
      .send({ email: dbUser.email, refreshToken: refreshToken.token })
      .expect(httpStatus.OK)
      .then(res => {
        expect(res.body).toHaveProperty('accessToken')
        expect(res.body).toHaveProperty('refreshToken')
        expect(res.body).toHaveProperty('expiresIn')
      })
  })

  it("should report error when email and refreshToken don't match", async () => {
    await RefreshToken.create(refreshToken)
    return request(app)
      .post('/v1/auth/refresh-token')
      .send({ email: user.email, refreshToken: refreshToken.token })
      .expect(httpStatus.UNAUTHORIZED)
      .then(res => {
        const { code } = res.body
        const { message } = res.body
        expect(code).toEqual(401)
        expect(message).toEqual('Incorrect email or refreshToken')
      })
  })

  it('should report error when email and refreshToken are not provided', () => {
    return request(app)
      .post('/v1/auth/refresh-token')
      .send({})
      .expect(httpStatus.BAD_REQUEST)
      .then(res => {
        // const field1 = res.body.errors[0].field
        // const location1 = res.body.errors[0].location
        // const messages1 = res.body.errors[0].messages
        // const field2 = res.body.errors[1].field
        // const location2 = res.body.errors[1].location
        // const messages2 = res.body.errors[1].messages
        // expect(field1).toEqual('email')
        // expect(location1).toEqual('body')
        // expect(messages1).toContain('"email" is required')
        // expect(field2).toEqual('refreshToken')
        // expect(location2).toEqual('body')
        // expect(messages2).toContain('"refreshToken" is required')
      })
  })

  it('should report error when the refreshToken is expired', async () => {
    await RefreshToken.create(expiredRefreshToken)

    return request(app)
      .post('/v1/auth/refresh-token')
      .send({ email: dbUser.email, refreshToken: expiredRefreshToken.token })
      .expect(httpStatus.UNAUTHORIZED)
      .then(res => {
        expect(res.body.code).toEqual(401)
        expect(res.body.message).toEqual('Invalid refresh token.')
      })
  })
})

describe('POST /v1/auth/send-password-reset', () => {
  it('should send an email with password reset link when email matches a user', async () => {
    const PasswordResetTokenObj = await PasswordResetToken.create(resetToken)

    expect(PasswordResetTokenObj.resetToken).toEqual(
      '5947397b323ae82d8c3a333b.c69d0435e62c9f4953af912442a3d064e20291f0d228c0552ed4be473e7d191ba40b18c2c47e8b9d'
    )
    expect(PasswordResetTokenObj.userId.toString()).toEqual('5947397b323ae82d8c3a333b')
    expect(PasswordResetTokenObj.userEmail).toEqual(dbUser.email)
    expect(PasswordResetTokenObj.expires).to.be.above(moment().add(1, 'hour').toDate())

    vi.spyOn(emailProviders, 'sendPasswordReset').mockResolvedValue('email sent')

    return request(app)
      .post('/v1/auth/send-password-reset')
      .send({ email: dbUser.email })
      .expect(httpStatus.OK)
      .then(res => {
        expect(res.body).toEqual('success')
      })
  })

  it("should report error when email doesn't match a user", async () => {
    await PasswordResetToken.create(resetToken)
    return request(app)
      .post('/v1/auth/send-password-reset')
      .send({ email: user.email })
      .expect(httpStatus.UNAUTHORIZED)
      .then(res => {
        const { code } = res.body
        const { message } = res.body
        expect(code).toEqual(httpStatus.UNAUTHORIZED)
        expect(message).toEqual('No account found with that email')
      })
  })

  it('should report error when email is not provided', () => {
    return request(app)
      .post('/v1/auth/send-password-reset')
      .send({})
      .expect(httpStatus.BAD_REQUEST)
      .then(res => {
        // const field1 = res.body.errors[0].field
        // const location1 = res.body.errors[0].location
        // const messages1 = res.body.errors[0].messages
        // expect(field1).toEqual('email')
        // expect(location1).toEqual('body')
        // expect(messages1).toContain('"email" is required')
      })
  })
})

describe('POST /v1/auth/reset-password', () => {
  it('should update password and send confirmation email when email and reset token are valid', async () => {
    await PasswordResetToken.create(resetToken)

    vi.spyOn(emailProviders, 'sendPasswordChangeEmail').mockResolvedValue('email sent')

    return request(app)
      .post('/v1/auth/reset-password')
      .send({
        email: dbUser.email,
        password: 'updatedPassword2',
        resetToken: resetToken.resetToken,
      })
      .expect(httpStatus.OK)
      .then(res => {
        expect(res.body).toEqual('Password Updated')
      })
  })

  it("should report error when email and reset token doesn't match a user", async () => {
    await PasswordResetToken.create(resetToken)
    return request(app)
      .post('/v1/auth/reset-password')
      .send({
        email: user.email,
        password: 'updatedPassword',
        resetToken: resetToken.resetToken,
      })
      .expect(httpStatus.UNAUTHORIZED)
      .then(res => {
        const { code } = res.body
        const { message } = res.body
        expect(code).toEqual(401)
        expect(message).toEqual('Cannot find matching reset token')
      })
  })

  it('should report error when email is not provided', () => {
    return request(app)
      .post('/v1/auth/reset-password')
      .send({ password: 'updatedPassword', resetToken: resetToken.resetToken })
      .expect(httpStatus.BAD_REQUEST)
      .then(res => {
        // const field1 = res.body.errors[0].field
        // const location1 = res.body.errors[0].location
        // const messages1 = res.body.errors[0].messages
        // expect(field1).toEqual('email')
        // expect(location1).toEqual('body')
        // expect(messages1).toContain('"email" is required')
      })
  })

  it('should report error when reset token is not provided', () => {
    return request(app)
      .post('/v1/auth/reset-password')
      .send({ email: dbUser.email, password: 'updatedPassword' })
      .expect(httpStatus.UNAUTHORIZED) // TODO: httpStatus.BAD_REQUEST
      .then(res => {
        // const field1 = res.body.errors[0].field
        // const location1 = res.body.errors[0].location
        // const messages1 = res.body.errors[0].messages
        // expect(field1).toEqual('resetToken')
        // expect(location1).toEqual('body')
        // expect(messages1).toContain('"resetToken" is required')
      })
  })

  it('should report error when password is not provided', () => {
    return request(app)
      .post('/v1/auth/reset-password')
      .send({ email: dbUser.email, resetToken: resetToken.resetToken })
      .expect(httpStatus.UNAUTHORIZED) // TODO: httpStatus.BAD_REQUEST
      .then(res => {
        // const field1 = res.body.errors[0].field
        // const location1 = res.body.errors[0].location
        // const messages1 = res.body.errors[0].messages
        // expect(field1).toEqual('password')
        // expect(location1).toEqual('body')
        // expect(messages1).toContain('"password" is required')
      })
  })

  it('should report error when the resetToken is expired', async () => {
    const expiredPasswordResetTokenObj = await PasswordResetToken.create(expiredResetToken)

    expect(expiredPasswordResetTokenObj.resetToken).toEqual(
      '5947397b323ae82d8c3a333b.c69d0435e62c9f4953af912442a3d064e20291f0d228c0552ed4be473e7d191ba40b18c2c47e8b9d'
    )
    expect(expiredPasswordResetTokenObj.userId.toString()).toEqual('5947397b323ae82d8c3a333b')
    expect(expiredPasswordResetTokenObj.userEmail).toEqual(dbUser.email)
    expect(expiredPasswordResetTokenObj.expires).to.be.below(moment().toDate())

    return request(app)
      .post('/v1/auth/reset-password')
      .send({
        email: dbUser.email,
        password: 'updated password',
        resetToken: expiredResetToken.resetToken,
      })
      .expect(httpStatus.UNAUTHORIZED)
      .then(res => {
        expect(res.body.code).toEqual(401)
        expect(res.body.message).toContain('Reset token is expired')
      })
  })
})
