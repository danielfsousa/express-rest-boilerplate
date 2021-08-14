import express from 'express'

import userRoutes from '#routes/v1/user'
import authRoutes from '#routes/v1/auth'

// prettier-ignore
const router = express.Router()
  .use('/users', userRoutes)
  .use('/auth', authRoutes)

export default router
