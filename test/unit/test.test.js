import { MongoDBContainer } from 'testcontainers'
import { test } from 'vitest'
import * as database from '#lib/database'

test('testing ci', async () => {
  const mongodbContainer = await new MongoDBContainer('mongo:6').start()
  await database.connect(mongodbContainer.getConnectionString())
  await mongodbContainer.stop()
  console.log('connected to db')
})
