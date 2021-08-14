import config from '#config'
import logger from '#lib/logger'
import app from '#lib/server'
import { connect as connectDatabase } from '#lib/mongoose'

const { port, env } = config

async function main() {
  await connectDatabase()
  app.listen(port, () => logger.info(`server started on port ${port} (${env})`))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
