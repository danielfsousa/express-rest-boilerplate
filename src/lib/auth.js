import passport from 'passport'
import BearerStrategy from 'passport-http-bearer'
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt'
import config from '#config'
import User from '#models/user'
import * as authProviders from '#services/auth'

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

const authMiddleware = passport.initialize()

passport.use('jwt', new JwtStrategy(jwtOptions, jwtHandler))
passport.use('facebook', new BearerStrategy(oAuthHandler('facebook')))
passport.use('google', new BearerStrategy(oAuthHandler('google')))

export default authMiddleware
