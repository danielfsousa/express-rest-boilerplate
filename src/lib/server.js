import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import passport from 'passport'
import logger from 'morgan'
import bodyParser from 'body-parser'

import config from '#config'
import routes from '#routes/v1/index'
import * as authStrategies from '#lib/passport'
import * as errorHandlingMiddlewares from '#middlewares/error'

const app = express()

app.use(logger(config.logs))
app.use(bodyParser.json())
app.use(helmet())
app.use(cors())

app.use(passport.initialize())
passport.use('jwt', authStrategies.jwt)
passport.use('facebook', authStrategies.facebook)
passport.use('google', authStrategies.google)

app.use('/v1', routes)
app.get('/status', (req, res) => res.send({ ok: true })) // TODO: use terminus

// if error is not an instanceOf APIError, convert it.
app.use(errorHandlingMiddlewares.converter)
// catch 404 and forward to error handler
app.use(errorHandlingMiddlewares.notFound)
// error handler, send stacktrace only during development
app.use(errorHandlingMiddlewares.handler)

export default app
