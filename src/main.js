import config from '#config'
import logger from '#lib/logger'
import { connect as connectDatabase } from '#lib/mongoose'
import app from '#lib/server'

const { port, env } = config

async function main() {
  await connectDatabase()
  app.listen(port, () => logger.info(`server started on port ${port} (${env})`))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
