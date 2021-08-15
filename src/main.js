import config from '#config'
import { connect as connectDatabase } from '#lib/database'
// import { verifySMTPConnection } from '#lib/email'
import logger from '#lib/logger'
import app from '#lib/server'

const { port, env } = config

async function main() {
  setupErrorHandling()
  await connectDatabase()
  // await verifySMTPConnection()
  app.listen(port, onAppListening)
}

function onAppListening() {
  logger.info({ env, msg: 'server started', url: `http://localhost:${port}` })
}

function onAppError(err) {
  logger.fatal(err)
  process.exit(1)
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

main().catch(onAppError)
