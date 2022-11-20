import express from 'express'
import * as controller from '#controllers/user'
import validate from '#middlewares/validation'

const router = express.Router()

router //
  .route('/')
  // .get(validate, authorize(ADMIN), controller.list)
  .get(validate, controller.list)

router //
  .route('/current')
  // .get(validate, authorize(), controller.getCurrent)
  .get(validate, controller.getCurrent)

router //
  .route('/:userId')
  // .get(validate, authorize(LOGGED_USER), controller.get)
  .get(validate, controller.get)
  // .patch(validate, authorize(LOGGED_USER), controller.update)
  .patch(validate, controller.update)
  // .delete(validate, authorize(LOGGED_USER), controller.remove)
  .delete(validate, controller.remove)

export default router
