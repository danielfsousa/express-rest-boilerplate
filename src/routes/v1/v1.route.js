import express from 'express'
import authRoutes from '#routes/v1/auth'
import userRoutes from '#routes/v1/user'

// prettier-ignore
const router = express.Router()
  .use('/users', userRoutes)
  .use('/auth', authRoutes)

export default router
