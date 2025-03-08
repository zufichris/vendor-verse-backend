import express from "express"
import { authMiddleware } from "../../middleware/auth"
import { userControllers } from "../../controller/user"
const router = express.Router()
router.use(authMiddleware.requireAuth, authMiddleware.requirePermission("user", "manage"))

router.route('/')
    .get(userControllers.getMe)
    .patch(userControllers.updateUser)

router.route('/address')
    .get(userControllers.getMeAddress)
    .post(userControllers.addMeAddress)
    .patch(userControllers.updateMeAddress)
router.route('/stats')
    .get(userControllers.getMeStats)

export default router