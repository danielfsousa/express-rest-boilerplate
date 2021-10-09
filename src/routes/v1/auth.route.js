import express from 'express'
import * as controller from '#controllers/auth'
import { oAuth as oAuthLogin } from '#middlewares/auth'
import validate from '#middlewares/validation'

const router = express.Router()

router //
  .route('/register')
  .post(validate, controller.register)

router //
  .route('/login')
  .post(validate, controller.login)

router //
  .route('/refresh-token')
  .post(validate, controller.refresh)

router //
  .route('/send-password-reset')
  .post(validate, controller.sendPasswordReset)

router //
  .route('/reset-password')
  .post(validate, controller.resetPassword)

router //
  .route('/facebook')
  .post(validate, oAuthLogin('facebook'), controller.oAuth)

router //
  .route('/google')
  .post(validate, oAuthLogin('google'), controller.oAuth)

export default router
