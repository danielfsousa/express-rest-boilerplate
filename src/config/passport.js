const { Strategy } = require('passport-jwt');
const { ExtractJwt } = require('passport-jwt');
const { jwtSecret } = require('./vars');
const User = require('../api/models/user.model');

const options = {
  secretOrKey: jwtSecret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
};

async function verify(payload, done) {
  try {
    const user = await User.findById(payload.sub);
    if (user) return done(null, user);
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}

module.exports = new Strategy(options, verify);
