import express from "express";
import { authControllers } from "../../controller/auth";
import { authMiddleware } from "../../middleware/auth";
const router = express.Router();
router.post("/", authControllers.signUp);
router.post("/login", authControllers.signIn);
router.get("/logout", authMiddleware.requireAuth, authControllers.signOut);
router.get("/google", authControllers.googleAuthControllers.authRequest);

router.get("/google/callback",
  authControllers.googleAuthControllers.getGoogleTokens,
  authControllers.googleAuthControllers.getUserProfile,
  authControllers.socialSignIn
);

export default router;