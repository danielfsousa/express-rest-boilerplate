import dotenv from 'dotenv'
import { cleanEnv, str, num } from 'envalid'
import path from 'path'
import LogLevel from '#enums/loglevel'

const appPath = path.dirname(import.meta.url).replace('file:', '')

dotenv.config({
  path: path.join(appPath, '../.env'),
})

const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ['development', 'test', 'production', 'staging'],
    default: 'development',
  }),
  PORT: num({ default: 3000 }),
  JWT_SECRET: str(),
  JWT_EXPIRATION_MINUTES: num({ default: 15 }),
  MONGO_URI: str(),
  MONGO_URI_TESTS: str({ default: '' }),
  EMAIL_HOST: str(),
  EMAIL_PORT: num({ default: 25 }),
  EMAIL_USERNAME: str(),
  EMAIL_PASSWORD: str(),
  LOG_LEVEL: str({
    choices: Object.values(LogLevel).map(l => l.str),
    default: LogLevel.INFO.str,
  }),
})

export default Object.freeze({
  appPath,
  logLevel: env.LOG_LEVEL,
  isProduction: env.isProduction,
  env: env.NODE_ENV,
  port: env.PORT,
  jwtSecret: env.JWT_SECRET,
  jwtExpirationInterval: env.JWT_EXPIRATION_MINUTES,
  mongo: {
    uri: env.isTest ? env.MONGO_URI_TESTS : env.MONGO_URI,
  },
  email: {
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    username: env.EMAIL_USERNAME,
    password: env.EMAIL_PASSWORD,
  },
})
