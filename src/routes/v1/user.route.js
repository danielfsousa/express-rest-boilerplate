import express from 'express'
import * as controller from '#controllers/user'
import { authorize, ADMIN, LOGGED_USER } from '#middlewares/auth'
import validate from '#middlewares/validation'

const router = express.Router()

/**
 * Load user when API with userId route parameter is hit
 */
router.param('userId', controller.load)

router //
  .route('/')
  .get(validate, authorize(ADMIN), controller.list)
  .post(validate, authorize(ADMIN), controller.create)

router //
  .route('/profile')
  .get(validate, authorize(), controller.loggedIn)

router //
  .route('/:userId')
  .get(validate, authorize(LOGGED_USER), controller.get)
  .put(validate, authorize(LOGGED_USER), controller.replace)
  .patch(validate, authorize(LOGGED_USER), controller.update)
  .delete(validate, authorize(LOGGED_USER), controller.remove)

export default router
