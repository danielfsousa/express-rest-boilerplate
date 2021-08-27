import assert from 'assert'
import mongoose from 'mongoose'
import config from '#config'
import LogLevel from '#enums/loglevel'
import logger from '#lib/logger'

if (logger.levelVal <= LogLevel.DEBUG.val) {
  mongoose.set('debug', true)
}

export async function connect() {
  // TODO: extract configuration to config.js file
  await mongoose.connect(config.mongo.uri, {
    useCreateIndex: true,
    keepAlive: 1,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })

  return mongoose.connection
}

export async function disconnect() {
  await mongoose.disconnect()
}

export async function ping() {
  const result = await mongoose.connection.db.admin().ping()
  assert(result?.ok === 1)
}
