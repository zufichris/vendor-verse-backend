import express from "express";
import { userControllers } from "../../controller/user";
import { authMiddleware } from "../../middleware/auth";

const router = express.Router();
router.use(authMiddleware.requireAuth, authMiddleware.requirePermission("user", "manage"),)
router.route("/")
  .post(userControllers.createUser)
  .get(userControllers.queryUsers);
router.route("/:custId",)
  .get(userControllers.getUser)
  .patch(userControllers.updateUser)
router.route("/address/:custId")
router.route("/stats/:custId")
  .get(userControllers.getUserStats)

export default router;
