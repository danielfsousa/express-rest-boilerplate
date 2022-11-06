import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { cleanEnv, str, num, bool } from 'envalid'
import { LogLevel, LogFormat } from '#enums/log'

const appPath = path.dirname(import.meta.url).replace('file:', '')
const pkgPath = path.join(appPath, '../package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))

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
  EMAIL_HOST: str(),
  EMAIL_PORT: num({ default: 25 }),
  EMAIL_USERNAME: str(),
  EMAIL_PASSWORD: str(),
  LOG_FORMAT: str({
    choices: Object.values(LogFormat),
    default: LogFormat.JSON,
  }),
  LOG_LEVEL: str({
    choices: Object.values(LogLevel).map(l => l.str),
    default: LogLevel.INFO.str,
  }),
  LOG_DATABASE_QUERIES: bool({
    default: false,
  }),
  OTEL_ENABLED: bool({
    default: false,
  }),
  OTEL_SERVICE_NAME: str(),
  OTEL_EXPORTER_JAEGER_ENDPOINT: str(),
})

export default Object.freeze({
  appPath,
  openApiPath: path.join(appPath, '../openapi.yaml'),
  version: pkg.version,
  env: env.NODE_ENV,
  isProduction: env.NODE_ENV === 'production',
  port: env.PORT,
  auth: {
    jwtSecret: env.JWT_SECRET,
    jwtExpirationInterval: env.JWT_EXPIRATION_MINUTES,
  },
  log: {
    format: env.LOG_FORMAT,
    level: env.LOG_LEVEL,
    databaseQueries: env.LOG_DATABASE_QUERIES,
  },
  otel: {
    isEnabled: env.OTEL_ENABLED,
  },
  mongo: {
    uri: env.MONGO_URI,
  },
  email: {
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    username: env.EMAIL_USERNAME,
    password: env.EMAIL_PASSWORD,
  },
})
