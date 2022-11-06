import http from 'node:http'
import { createTerminus } from '@godaddy/terminus'
import config from '#config'
import * as database from '#lib/database'
import * as email from '#lib/email'
import logger from '#lib/logger'
import app from '#lib/server'

const { port } = config
const server = http.createServer(app)

async function main() {
  try {
    await startServer()
  } catch (err) {
    logger.fatal(err)
    process.exit(1)
  }
}

async function startServer() {
  setupErrorHandling()
  await database.connect(config.mongo.uri)
  await email.verifyConnection()

  createTerminus(server, {
    onSignal,
    onShutdown,
    logger: (msg, err) => logger.error({ msg, err }),
    healthChecks: {
      '/health': onHealthCheck,
      __unsafeExposeStackTraces: !config.isProduction,
    },
  })

  server.listen(port, onListening)
}

function onListening() {
  logger.info({ msg: `listening on http://localhost:${port}`, config })
}

async function onSignal() {
  logger.info('server is starting cleanup')
  database
    .disconnect()
    .then(() => logger.info('database disconnected'))
    .catch(err => logger.error({ err, msg: 'error during disconnection' }))
}

async function onShutdown() {
  logger.info('cleanup finished, server is shutting down')
}

async function onHealthCheck() {
  await database.ping()
}

function setupErrorHandling() {
  process.on('unhandledRejection', (err, promise) => {
    logger.fatal({ err, msg: `Unhandled Rejection at: ${promise}` })
    // send error to your error tracking software here
    process.exit(1)
  })

  process.on('uncaughtException', (err, origin) => {
    logger.fatal({ err, msg: `Uncaught Exception: ${err.message} at: ${origin}` })
    // send error to your error tracking software here
    process.exit(1)
  })
}

await main()
