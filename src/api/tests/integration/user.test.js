/* eslint-disable arrow-body-style */
/* eslint-disable no-unused-expressions */
const request = require('supertest');
const httpStatus = require('http-status');
const { expect } = require('chai');
const { some, omitBy, isNil } = require('lodash');
const app = require('../../../index');
const User = require('../../models/user.model');

/**
 * root level hooks
 */

async function format(user) {
  const formated = user;

  // delete password
  delete formated.password;

  // get users from database
  const dbUser = (await User.findOne({ email: user.email })).transform();

  // remove null and undefined properties
  return omitBy(dbUser, isNil);
}

describe('Users API', () => {
  let accessToken;
  let dbUsers;
  let user;
  let admin;

  beforeEach(async () => {
    dbUsers = {
      branStark: {
        email: 'branstark@gmail.com',
        password: 'mypassword',
        name: 'Bran Stark',
        role: 'admin',
      },
      johnSnow: {
        email: 'jonsnow@gmail.com',
        password: '123456',
        name: 'Jon Snow',
      },
    };

    user = {
      email: 'sousa.dfs@gmail.com',
      password: '123456',
      name: 'Daniel Sousa',
    };

    admin = {
      email: 'sousa.dfs@gmail.com',
      password: '123456',
      name: 'Daniel Sousa',
      role: 'admin',
    };

    await User.remove({});
    await User.insertMany([dbUsers.branStark, dbUsers.johnSnow]);
    accessToken = (await User.findAndGenerateToken(dbUsers.branStark)).accessToken;
  });

  describe('POST /v1/users', () => {
    it('should create a new user when request is ok', () => {
      return request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(admin)
        .expect(httpStatus.CREATED)
        .then((res) => {
          delete admin.password;
          expect(res.body).to.include(admin);
        });
    });

    it('should create a new user and set default role to "user"', () => {
      return request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(user)
        .expect(httpStatus.CREATED)
        .then((res) => {
          expect(res.body.role).to.be.equal('user');
        });
    });

    it('should report error when email already exists', () => {
      user.email = dbUsers.branStark.email;

      return request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(user)
        .expect(httpStatus.CONFLICT)
        .then((res) => {
          const field = res.body.errors[0].field;
          const location = res.body.errors[0].location;
          const messages = res.body.errors[0].messages;
          expect(field).to.be.equal('email');
          expect(location).to.be.equal('body');
          expect(messages).to.include('"email" already exists');
        });
    });

    it('should report error when email is not provided', () => {
      delete user.email;

      return request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(user)
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const field = res.body.errors[0].field;
          const location = res.body.errors[0].location;
          const messages = res.body.errors[0].messages;
          expect(field).to.be.equal('email');
          expect(location).to.be.equal('body');
          expect(messages).to.include('"email" is required');
        });
    });

    it('should report error when password length is less than 6', () => {
      user.password = '12345';

      return request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(user)
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const field = res.body.errors[0].field;
          const location = res.body.errors[0].location;
          const messages = res.body.errors[0].messages;
          expect(field).to.be.equal('password');
          expect(location).to.be.equal('body');
          expect(messages).to.include('"password" length must be at least 6 characters long');
        });
    });
  });

  describe('GET /v1/users', () => {
    it('should get all users', () => {
      return request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(httpStatus.OK)
        .then(async (res) => {
          const bran = format(dbUsers.branStark);
          const john = format(dbUsers.johnSnow);

          const includesBranStark = some(res.body, bran);
          const includesjohnSnow = some(res.body, john);

          // before comparing it is necessary to convert String to Date
          res.body[0].createdAt = new Date(res.body[0].createdAt);
          res.body[1].createdAt = new Date(res.body[1].createdAt);

          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf(2);
          expect(includesBranStark).to.be.true;
          expect(includesjohnSnow).to.be.true;
        });
    });

    it('should get all users with pagination', () => {
      return request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ page: 2, perPage: 1 })
        .expect(httpStatus.OK)
        .then((res) => {
          delete dbUsers.johnSnow.password;
          const john = format(dbUsers.johnSnow);
          const includesjohnSnow = some(res.body, john);

          // before comparing it is necessary to convert String to Date
          res.body[0].createdAt = new Date(res.body[0].createdAt);

          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf(1);
          expect(includesjohnSnow).to.be.true;
        });
    });

    it('should filter users', () => {
      return request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ email: dbUsers.johnSnow.email })
        .expect(httpStatus.OK)
        .then((res) => {
          delete dbUsers.johnSnow.password;
          const john = format(dbUsers.johnSnow);
          const includesjohnSnow = some(res.body, john);

          // before comparing it is necessary to convert String to Date
          res.body[0].createdAt = new Date(res.body[0].createdAt);

          expect(res.body).to.be.an('array');
          expect(res.body).to.have.lengthOf(1);
          expect(includesjohnSnow).to.be.true;
        });
    });

    it('should throw error when pagination\'s parameters are not a number', () => {
      return request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ page: '?', perPage: 'whaat' })
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const field = res.body.errors[0].field;
          const location = res.body.errors[0].location;
          const messages = res.body.errors[0].messages;
          expect(field).to.be.equal('page');
          expect(location).to.be.equal('query');
          expect(messages).to.include('"page" must be a number');
          return Promise.resolve(res);
        })
        .then((res) => {
          const field = res.body.errors[1].field;
          const location = res.body.errors[1].location;
          const messages = res.body.errors[1].messages;
          expect(field).to.be.equal('perPage');
          expect(location).to.be.equal('query');
          expect(messages).to.include('"perPage" must be a number');
        });
    });
  });

  describe('GET /v1/users/:userId', () => {
    it('should get user', async () => {
      const id = (await User.findOne({}))._id;
      delete dbUsers.branStark.password;

      return request(app)
        .get(`/v1/users/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.include(dbUsers.branStark);
        });
    });

    it('should report error "User does not exist" when user does not exists', () => {
      return request(app)
        .get('/v1/users/56c787ccc67fc16ccc1a5e92')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          expect(res.body.code).to.be.equal(404);
          expect(res.body.message).to.be.equal('User does not exist');
        });
    });

    it('should report error "User does not exist" when id is not a valid ObjectID', () => {
      return request(app)
        .get('/v1/users/palmeiras1914')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          expect(res.body.code).to.be.equal(404);
          expect(res.body.message).to.equal('User does not exist');
        });
    });
  });

  describe('PUT /v1/users/:userId', () => {
    it('should replace user', async () => {
      delete dbUsers.branStark.password;
      const id = (await User.findOne(dbUsers.branStark))._id;

      return request(app)
        .put(`/v1/users/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(user)
        .expect(httpStatus.OK)
        .then((res) => {
          delete user.password;
          expect(res.body).to.include(user);
          expect(res.body.role).to.be.equal('user');
        });
    });

    it('should report error when email is not provided', async () => {
      const id = (await User.findOne({}))._id;
      delete user.email;

      return request(app)
        .put(`/v1/users/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(user)
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const field = res.body.errors[0].field;
          const location = res.body.errors[0].location;
          const messages = res.body.errors[0].messages;
          expect(field).to.be.equal('email');
          expect(location).to.be.equal('body');
          expect(messages).to.include('"email" is required');
        });
    });

    it('should report error user when password length is less than 6', async () => {
      const id = (await User.findOne({}))._id;
      user.password = '12345';

      return request(app)
        .put(`/v1/users/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(user)
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          const field = res.body.errors[0].field;
          const location = res.body.errors[0].location;
          const messages = res.body.errors[0].messages;
          expect(field).to.be.equal('password');
          expect(location).to.be.equal('body');
          expect(messages).to.include('"password" length must be at least 6 characters long');
        });
    });

    it('should report error "User does not exist" when user does not exists', () => {
      return request(app)
        .put('/v1/users/palmeiras1914')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          expect(res.body.code).to.be.equal(404);
          expect(res.body.message).to.be.equal('User does not exist');
        });
    });
  });

  describe('PATCH /v1/users/:userId', () => {
    it('should update user', async () => {
      delete dbUsers.branStark.password;
      const id = (await User.findOne(dbUsers.branStark))._id;
      const name = user.name;

      return request(app)
        .patch(`/v1/users/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name })
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.name).to.be.equal(name);
          expect(res.body.email).to.be.equal(dbUsers.branStark.email);
        });
    });

    it('should not update user when no parameters were given', async () => {
      delete dbUsers.branStark.password;
      const id = (await User.findOne(dbUsers.branStark))._id;

      return request(app)
        .patch(`/v1/users/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send()
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body).to.include(dbUsers.branStark);
        });
    });

    it('should report error "User does not exist" when user does not exists', () => {
      return request(app)
        .patch('/v1/users/palmeiras1914')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          expect(res.body.code).to.be.equal(404);
          expect(res.body.message).to.be.equal('User does not exist');
        });
    });
  });

  describe('DELETE /v1/users', () => {
    it('should delete user', async () => {
      const id = (await User.findOne({}))._id;

      return request(app)
        .delete(`/v1/users/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(httpStatus.NO_CONTENT)
        .then(() => request(app).get('/v1/users'))
        .then(async () => {
          const users = await User.find({});
          expect(users).to.have.lengthOf(1);
        });
    });

    it('should report error "User does not exist" when user does not exists', () => {
      return request(app)
        .delete('/v1/users/palmeiras1914')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(httpStatus.NOT_FOUND)
        .then((res) => {
          expect(res.body.code).to.be.equal(404);
          expect(res.body.message).to.be.equal('User does not exist');
        });
    });
  });
});
