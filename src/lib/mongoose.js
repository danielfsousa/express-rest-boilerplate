import mongoose from 'mongoose'
import config from '#config'
import logger from '#lib/logger'

const { mongo, env } = config

// Exit application on error
mongoose.connection.on('error', err => {
  logger.error(`MongoDB connection error: ${err}`)
  process.exit(-1)
})

// print mongoose logs in dev env
if (env === 'development') {
  mongoose.set('debug', true)
}

export async function connect() {
  await mongoose.connect(mongo.uri, {
    useCreateIndex: true,
    keepAlive: 1,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })

  return mongoose.connection
}
