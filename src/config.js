import dotenv from 'dotenv-safe'
import path from 'path'
import LogLevel from '#enums/loglevel'

const appPath = path.dirname(import.meta.url).replace('file:', '')

// TODO: use a better library
dotenv.config({
  path: path.join(appPath, '../.env'),
  sample: path.join(appPath, '../.env.example'),
})

const logLevel = process.env.LOG_LEVEL ?? LogLevel.INFO.str

export default {
  appPath,
  logLevel,
  isProduction: process.env.NODE_ENV === 'production',
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpirationInterval: process.env.JWT_EXPIRATION_MINUTES,
  mongo: {
    uri: process.env.NODE_ENV === 'test' ? process.env.MONGO_URI_TESTS : process.env.MONGO_URI,
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    username: process.env.EMAIL_USERNAME,
    password: process.env.EMAIL_PASSWORD,
  },
}
