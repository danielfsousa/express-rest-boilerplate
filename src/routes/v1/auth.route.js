import express from 'express'
import validate from 'express-validation'
import * as controller from '#controllers/auth'
import { oAuth as oAuthLogin } from '#middlewares/auth'
import {
  login,
  register,
  oAuth,
  refresh,
  sendPasswordReset,
  passwordReset,
} from '#validations/auth'

const router = express.Router()

router.route('/register').post(validate(register), controller.register)
router.route('/login').post(validate(login), controller.login)
router.route('/refresh-token').post(validate(refresh), controller.refresh)
router.route('/send-password-reset').post(validate(sendPasswordReset), controller.sendPasswordReset)
router.route('/reset-password').post(validate(passwordReset), controller.resetPassword)
router.route('/facebook').post(validate(oAuth), oAuthLogin('facebook'), controller.oAuth)
router.route('/google').post(validate(oAuth), oAuthLogin('google'), controller.oAuth)

export default router
