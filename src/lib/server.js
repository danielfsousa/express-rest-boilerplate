import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
import 'express-async-errors'
import pino from 'express-pino-logger'
import helmet from 'helmet'
import authMiddleware from '#lib/auth'
import logger from '#lib/logger'
import { notFoundErrorHandler, genericErrorHandler, catchAllErrorHandler } from '#middlewares/error'
import v1routes from '#routes/v1/v1'

const app = express()

// middlewares
app.use(bodyParser.json())
app.use(helmet())
app.use(cors())
app.use(pino({ logger }))
app.use(authMiddleware)

// routes
app.use('/v1', v1routes)

// error handling
app.use(notFoundErrorHandler)
app.use(genericErrorHandler)
app.use(catchAllErrorHandler)

export default app
