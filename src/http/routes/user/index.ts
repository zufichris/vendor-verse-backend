import express from "express";
import { userControllers } from "../../controllers/user";
import { authMiddleWare } from "../../middleware/auth";
import { Role } from "../../../data/enums/user";

const router = express.Router();
router.use(
  authMiddleWare.requireAuth,
);

router.route("/me").get(userControllers.getMe)

router
  .route("/")
  .post(userControllers.createUser)
  .get((req, res, next) => authMiddleWare.authorize([Role.Admin], req, res, next), userControllers.queryUsers);
export default router;
