import express from "express";
import { userControllers } from "../../controller/user";
import { authMiddleware } from "../../middleware/auth";

const router = express.Router();
router.use(authMiddleware.requireAuth,)
router.route("/")
  .post( authMiddleware.requirePermission("user", "create"),userControllers.createUser)
  .get(userControllers.queryUsers);
router.route("/:userId",)
  .get(userControllers.getUser)
  .patch( authMiddleware.requirePermission("user", "update",),userControllers.updateUser,)
router.route("/address/:custId")
router.route("/stats/:custId")
  .get(userControllers.getUserStats)

export default router;
