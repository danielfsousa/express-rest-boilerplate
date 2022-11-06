import { MongoDBContainer } from 'testcontainers'
import * as database from '#lib/database'
import User from '#models/user'

const mongodbContainer = await new MongoDBContainer('mongo:6').start()

await database.connect(mongodbContainer.getConnectionString())
await User.create({
  email: 'admin@gmail.com',
  password: 'mypassword',
  name: 'Admin',
  role: 'admin',
})

await mongodbContainer.stop()
process.exit(0)
