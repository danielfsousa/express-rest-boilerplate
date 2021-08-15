import bodyParser from 'body-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import logger from 'morgan'
import passport from 'passport'
import config from '#config'
import * as authStrategies from '#lib/passport'
import * as errorHandlingMiddlewares from '#middlewares/error'
import routes from '#routes/v1/index'

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
