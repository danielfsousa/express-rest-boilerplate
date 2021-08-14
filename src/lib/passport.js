import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'
import BearerStrategy from 'passport-http-bearer'

import config from '#config'
import User from '#models/user'
import * as authProviders from '#services/auth-provider'

const jwtOptions = {
  secretOrKey: config.jwtSecret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
}

async function jwtHandler(payload, done) {
  try {
    const user = await User.findById(payload.sub)
    if (user) return done(null, user)
    return done(null, false)
  } catch (error) {
    return done(error, false)
  }
}

function oAuthHandler(service) {
  return async (token, done) => {
    try {
      const userData = await authProviders[service](token)
      const user = await User.oAuthLogin(userData)
      return done(null, user)
    } catch (err) {
      return done(err)
    }
  }
}

const jwt = new JwtStrategy(jwtOptions, jwtHandler)
const facebook = new BearerStrategy(oAuthHandler('facebook'))
const google = new BearerStrategy(oAuthHandler('google'))

export { jwt, facebook, google }
