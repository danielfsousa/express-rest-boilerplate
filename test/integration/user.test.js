import bcrypt from 'bcryptjs'
import httpStatus from 'http-status'
import { omit, isNil, omitBy, some } from 'lodash-es'
import request from 'supertest'
import { MongoDBContainer } from 'testcontainers'
import { expect, describe, it, vi, beforeAll, beforeEach, afterAll } from 'vitest'
import config from '#config'
import * as database from '#lib/database'
import app from '#lib/server'
import User from '#models/user'

async function format(user) {
  const dbUser = (await User.findOne({ email: user.email })).transform()
  return omitBy(dbUser, isNil)
}

/** @type {import("testcontainers").StartedMongoDBContainer} */
let mongodbContainer
let adminAccessToken, userAccessToken, dbUsers, user2

beforeAll(async () => {
  mongodbContainer = await new MongoDBContainer('mongo:6').start()
  await database.connect(mongodbContainer.getConnectionString())
})

afterAll(async () => {
  await mongodbContainer.stop()
})

beforeEach(async () => {
  const password = '123456'
  const passwordHashed = await bcrypt.hash(password, 1)

  dbUsers = {
    branStark: {
      email: 'branstark@gmail.com',
      password: passwordHashed,
      name: 'Bran Stark',
      role: 'admin',
    },
    jonSnow: {
      email: 'jonsnow@gmail.com',
      password: passwordHashed,
      name: 'Jon Snow',
    },
  }

  user2 = {
    email: 'sousa.dfs@gmail.com',
    password,
    name: 'Daniel Sousa',
  }

  await User.deleteMany()
  await User.insertMany(dbUsers.branStark)
  await User.insertMany(dbUsers.jonSnow)

  dbUsers.branStark.password = password
  dbUsers.jonSnow.password = password
  adminAccessToken = `Bearer ${(await User.findAndGenerateToken(dbUsers.branStark)).accessToken}`
  userAccessToken = `Bearer ${(await User.findAndGenerateToken(dbUsers.jonSnow)).accessToken}`
})

describe('GET /v1/users', () => {
  it('should get all users', () => {
    return request(app)
      .get('/v1/users')
      .set('Authorization', adminAccessToken)
      .expect(httpStatus.OK)
      .then(async res => {
        const bran = await format(dbUsers.branStark)
        const john = await format(dbUsers.jonSnow)

        res.body[0].createdAt = new Date(res.body[0].createdAt)
        res.body[1].createdAt = new Date(res.body[1].createdAt)

        const includesBranStark = some(res.body, bran)
        const includesjonSnow = some(res.body, john)

        expect(res.body).toHaveLength(2)
        expect(includesBranStark).toBe(true)
        expect(includesjonSnow).toBe(true)
      })
  })

  it('should get all users with pagination', () => {
    return request(app)
      .get('/v1/users')
      .set('Authorization', adminAccessToken)
      .query({ page: 2, perPage: 1 })
      .expect(httpStatus.OK)
      .then(async res => {
        expect(res.body[0]).toBeTypeOf('object')
        expect(res.body).toHaveLength(1)
        expect(res.body[0].name).toBe('Bran Stark')
      })
  })

  it('should filter users', () => {
    return request(app)
      .get('/v1/users')
      .set('Authorization', adminAccessToken)
      .query({ email: dbUsers.jonSnow.email })
      .expect(httpStatus.OK)
      .then(async res => {
        const john = await format(dbUsers.jonSnow)

        res.body[0].createdAt = new Date(res.body[0].createdAt)

        const includesjonSnow = some(res.body, john)

        expect(res.body).toHaveLength(1)
        expect(includesjonSnow).toBe(true)
      })
  })

  it("should report error when pagination's parameters are not a number", () => {
    return request(app)
      .get('/v1/users')
      .set('Authorization', adminAccessToken)
      .query({ page: '?', perPage: 'whaat' })
      .expect(httpStatus.BAD_REQUEST)
      .then(res => {
        // TODO: fix error handling middleware json response
        // expect(res.body.errors[0].field).toBe('page')
        // expect(res.body.errors[0].location).toBe('query')
        // expect(res.body.errors[0].messages).toContain('"page" must be a number')
        // expect(res.body.errors[1].field).toBe('perPage')
        // expect(res.body.errors[1].location).toBe('query')
        // expect(res.body.errors[1].messages).toContain('"perPage" must be a number')
      })
  })

  it('should report error if logged user is not an admin', () => {
    return request(app)
      .get('/v1/users')
      .set('Authorization', userAccessToken)
      .expect(httpStatus.FORBIDDEN)
      .then(res => {
        expect(res.body.code).toBe(httpStatus.FORBIDDEN)
        expect(res.body.message).toBe('Forbidden')
      })
  })
})

describe('GET /v1/users/:userId', () => {
  it('should get user', async () => {
    const id = (await User.findOne({}))._id
    return request(app)
      .get(`/v1/users/${id}`)
      .set('Authorization', adminAccessToken)
      .expect(httpStatus.OK)
      .then(res => {
        expect(res.body).toContain(omit(dbUsers.branStark, 'password'))
      })
  })

  it('should report error "User does not exist" when user does not exists', () => {
    return request(app)
      .get('/v1/users/56c787ccc67fc16ccc1a5e92')
      .set('Authorization', adminAccessToken)
      .expect(httpStatus.NOT_FOUND)
      .then(res => {
        expect(res.body.code).toBe(404)
        expect(res.body.message).toBe('User does not exist')
      })
  })

  it('should report error "User does not exist" when id is not a valid ObjectID', () => {
    return request(app)
      .get('/v1/users/palmeiras1914')
      .set('Authorization', adminAccessToken)
      .expect(httpStatus.NOT_FOUND)
      .then(res => {
        expect(res.body.code).toBe(404)
        expect(res.body.message).toBe('User does not exist')
      })
  })

  it('should report error when logged user is not the same as the requested one', async () => {
    const id = (await User.findOne({ email: dbUsers.branStark.email }))._id
    return request(app)
      .get(`/v1/users/${id}`)
      .set('Authorization', userAccessToken)
      .expect(httpStatus.FORBIDDEN)
      .then(res => {
        expect(res.body.code).toBe(httpStatus.FORBIDDEN)
        expect(res.body.message).toBe('Forbidden')
      })
  })
})

describe('PATCH /v1/users/:userId', () => {
  it('should update user', async () => {
    const id = (await User.findOne({ email: dbUsers.branStark.email }))._id
    const { name } = user2
    return request(app)
      .patch(`/v1/users/${id}`)
      .set('Authorization', adminAccessToken)
      .send({ name: user2.name })
      .expect(httpStatus.OK)
      .then(res => {
        expect(res.body.name).toBe(name)
        expect(res.body.email).toBe(dbUsers.branStark.email)
      })
  })

  it('should not update user when no parameters were given', async () => {
    const id = (await User.findOne({ email: dbUsers.branStark.email }))._id
    return request(app)
      .patch(`/v1/users/${id}`)
      .set('Authorization', adminAccessToken)
      .send()
      .expect(httpStatus.OK)
      .then(res => {
        expect(res.body).toContain(omit(dbUsers.branStark, 'password'))
      })
  })

  it('should report error "User does not exist" when user does not exists', () => {
    return request(app)
      .patch('/v1/users/palmeiras1914')
      .set('Authorization', adminAccessToken)
      .expect(httpStatus.NOT_FOUND)
      .then(res => {
        expect(res.body.code).toBe(404)
        expect(res.body.message).toBe('User does not exist')
      })
  })

  it('should report error when logged user is not the same as the requested one', async () => {
    const id = (await User.findOne({ email: dbUsers.branStark.email }))._id
    return request(app)
      .patch(`/v1/users/${id}`)
      .set('Authorization', userAccessToken)
      .expect(httpStatus.FORBIDDEN)
      .then(res => {
        expect(res.body.code).toBe(httpStatus.FORBIDDEN)
        expect(res.body.message).toBe('Forbidden')
      })
  })

  it('should not update the role of the user (not admin)', async () => {
    const id = (await User.findOne({ email: dbUsers.jonSnow.email }))._id
    const role = 'admin'
    return request(app)
      .patch(`/v1/users/${id}`)
      .set('Authorization', userAccessToken)
      .send({ role })
      .expect(httpStatus.OK)
      .then(res => {
        expect(res.body.role).not.toBe(role)
      })
  })
})

describe('DELETE /v1/users', () => {
  it('should delete user', async () => {
    const id = (await User.findOne({}))._id
    return request(app)
      .delete(`/v1/users/${id}`)
      .set('Authorization', adminAccessToken)
      .expect(httpStatus.NO_CONTENT)
      .then(() => request(app).get('/v1/users'))
      .then(async () => {
        const users = await User.find({})
        expect(users).toHaveLength(1)
      })
  })

  it('should report error "User does not exist" when user does not exists', () => {
    return request(app)
      .delete('/v1/users/palmeiras1914')
      .set('Authorization', adminAccessToken)
      .expect(httpStatus.NOT_FOUND)
      .then(res => {
        expect(res.body.code).toBe(404)
        expect(res.body.message).toBe('User does not exist')
      })
  })

  it('should report error when logged user is not the same as the requested one', async () => {
    const id = (await User.findOne({ email: dbUsers.branStark.email }))._id
    return request(app)
      .delete(`/v1/users/${id}`)
      .set('Authorization', userAccessToken)
      .expect(httpStatus.FORBIDDEN)
      .then(res => {
        expect(res.body.code).toBe(httpStatus.FORBIDDEN)
        expect(res.body.message).toBe('Forbidden')
      })
  })
})

describe('GET /v1/users/current', () => {
  it("should get the logged user's info", () => {
    return request(app)
      .get('/v1/users/current')
      .set('Authorization', userAccessToken)
      .expect(httpStatus.OK)
      .then(res => {
        expect(res.body).toContain(omit(dbUsers.jonSnow, 'password'))
      })
  })

  it('should report error when accessToken is expired', async () => {
    const expiredAccessToken = (await User.findAndGenerateToken(dbUsers.branStark)).accessToken

    // move clock forward by minutes set in config + 1 minute
    vi.useFakeTimers().advanceTimersByTime(config.jwtExpirationInterval * 60000 + 60000)

    return request(app)
      .get('/v1/users/current')
      .set('Authorization', `Bearer ${expiredAccessToken}`)
      .expect(httpStatus.UNAUTHORIZED)
      .then(res => {
        expect(res.body.code).toBe(httpStatus.UNAUTHORIZED)
        expect(res.body.message).toBe('jwt expired')
        expect(res.body).not.toHaveProperty('stack')
      })
  })
})
