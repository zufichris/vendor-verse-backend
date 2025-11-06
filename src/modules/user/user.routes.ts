import express, { Router } from "express";
import { UserController } from "./user.controllers";
import { AuthMiddleware } from "../../core/middleware/auth.middleware";
import { UserRole } from "./user.types";
import { initCartModule } from "../cart";

export function CreateUserRouter(
    userController: UserController,
    authMiddleWare: AuthMiddleware,
): Router {
    const router = express.Router();

    router.route("/me").get(authMiddleWare.requireAuth, userController.getMe);

    router.post("/register", userController.register);

    router.post("/login", userController.login);

    router.post("/refresh-token", userController.refreshToken);

    router.post("/password-reset/request", userController.requestPasswordReset);

    router.post("/password-reset/confirm", userController.resetPassword);

    router.post("/verify-email", userController.verifyEmail); // if u want to pass params via request body
    router.post("/verify-email/:userId/:token", userController.verifyEmail);

    router
        .route("/profile")
        .get(authMiddleWare.requireAuth, userController.getUserProfile)
        .put(authMiddleWare.requireAuth, userController.updateProfile);

    router.get(
        "/profile/:id",
        authMiddleWare.requireAuth,
        authMiddleWare.authorize(UserRole.ADMIN),
        userController.getUserProfile,
    );

    router.put(
        "/preferences",
        authMiddleWare.requireAuth,
        userController.updatePreferences,
    );

    router.post("/logout", authMiddleWare.requireAuth, userController.logout);

    router.post("/change-password", userController.changePassword);

    router.post("/resend-verification", authMiddleWare.alloAnonmous, userController.resendEmailVerification);

    router.delete(
        "/account",
        authMiddleWare.requireAuth,
        userController.deleteAccount,
    );

    router.post(
        "/addresses",
        authMiddleWare.requireAuth,
        userController.addAddress,
    );

    router.put(
        "/addresses/:addressIndex",
        authMiddleWare.requireAuth,
        userController.updateAddress,
    );

    router.delete(
        "/addresses/:addressIndex",
        authMiddleWare.requireAuth,
        userController.deleteAddress,
    );

    router.put(
        "/:userId/status",
        authMiddleWare.requireAuth,
        authMiddleWare.authorize(UserRole.ADMIN),
        userController.updateUserStatus,
    );

    router.delete(
        "/:userId",
        authMiddleWare.requireAuth,
        authMiddleWare.authorize(UserRole.ADMIN),
        userController.softDeleteUser,
    );

    router.post("/:userId/restore", userController.restoreUser);

    router.get(
        "/analytics",
        authMiddleWare.requireAuth,
        authMiddleWare.authorize(UserRole.ADMIN),
        userController.getUserAnalytics,
    );

    router.post(
        "/:userId/metrics",
        authMiddleWare.requireAuth,
        authMiddleWare.authorize(UserRole.ADMIN),
        userController.updateUserMetrics,
    );

    router.use('/cart', initCartModule())

    router.route("/").get(userController.getAllUsers);
    router.route("/:id").get(userController.getUserById);

    return router;
}
