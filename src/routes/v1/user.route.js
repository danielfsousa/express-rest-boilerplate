import express from 'express'
import validate from 'express-validation'
import * as controller from '#controllers/user'
import { authorize, ADMIN, LOGGED_USER } from '#middlewares/auth'
import { listUsers, createUser, replaceUser, updateUser } from '#validations/user'

const router = express.Router()

/**
 * Load user when API with userId route parameter is hit
 */
router.param('userId', controller.load)

router
  .route('/')
  .get(authorize(ADMIN), validate(listUsers), controller.list)
  .post(authorize(ADMIN), validate(createUser), controller.create)

router.route('/profile').get(authorize(), controller.loggedIn)

router
  .route('/:userId')
  .get(authorize(LOGGED_USER), controller.get)
  .put(authorize(LOGGED_USER), validate(replaceUser), controller.replace)
  .patch(authorize(LOGGED_USER), validate(updateUser), controller.update)
  .delete(authorize(LOGGED_USER), controller.remove)

export default router
