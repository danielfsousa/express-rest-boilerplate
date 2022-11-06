import 'express-async-errors'
import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
import pino from 'express-pino-logger'
import helmet from 'helmet'
import authMiddleware from '#lib/auth'
import logger from '#lib/logger'
import { errorHandlerMiddleware, notFoundMiddleware } from '#middlewares/error'
import metricsMidddleware from '#middlewares/metrics'
import openApiMidddlewares from '#middlewares/openapi'
import addTraceIdMiddleware from '#middlewares/traceId'
import v1routes from '#routes/v1/v1'

const app = express()

// middlewares
app.use(bodyParser.json())
app.use(helmet())
app.use(cors())
// @ts-ignore pino version mismatch
app.use(pino({ logger }))
app.use(authMiddleware)
app.use(metricsMidddleware)
app.use(addTraceIdMiddleware)

app.use('/docs', ...openApiMidddlewares)

// routes
app.use('/v1', v1routes)

// error handling
app.use(notFoundMiddleware)
app.use(errorHandlerMiddleware)

export default app
