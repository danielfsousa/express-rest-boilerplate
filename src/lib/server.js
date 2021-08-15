import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
import pino from 'express-pino-logger'
import helmet from 'helmet'
import authMiddleware from '#lib/auth'
import logger from '#lib/logger'
import * as errorHandlingMiddlewares from '#middlewares/error'
import v1routes from '#routes/v1/index'

const app = express()

// middlewares
app.use(bodyParser.json())
app.use(helmet())
app.use(cors())
app.use(pino({ logger }))
app.use(authMiddleware)

// routes
app.use('/v1', v1routes)
app.get('/status', (req, res) => res.send({ ok: true })) // TODO: use terminus

// error handling
// if error is not an instanceOf APIError, convert it.
app.use(errorHandlingMiddlewares.converter)
// catch 404 and forward to error handler
app.use(errorHandlingMiddlewares.notFound)
// error handler, send stacktrace only during development
app.use(errorHandlingMiddlewares.handler)

export default app
