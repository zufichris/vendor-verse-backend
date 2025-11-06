import { Request, Response } from "express";
import { ApiHandler } from "../../util/api-handler";
import { UserService } from "./user.service";
import {
    CreateUserDTO,
    LoginDTO,
    UpdateUserDTO,
    PasswordResetDTO,
    AddressDTO,
} from "./user.dtos";
import { UserStatus } from "./user.types";
import { AppError } from "../../core/middleware/error.middleware";
import { env } from "../../config";

export class UserController {
    constructor(private readonly userService: UserService) { }

    public getMe = ApiHandler(async (req: Request, res: Response) => {
        const user = req.user;
        if (!user) {
            throw AppError.forbidden("user not logged in ");
        }
        res.status(201).json({
            success: true,
            message: "user retrieved successfully",
            data: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                status: user.status,
                isEmailVerified: user.isEmailVerified,
            },
        });
    });
    getAllUsers = ApiHandler(async (req: Request, res: Response) => {
        const result = await this.userService.getAllUsers(req.query);
        res.status(200).json({
            success: true,
            message: "Users retrieved successfully",
            data: result,
            status: 200,
        });
    });
    getUserById = ApiHandler(async (req: Request, res: Response) => {
        const userId = req.params.id;
        if (!userId) {
            throw AppError.badRequest("User ID is required");
        }
        const user = await this.userService.getUserById(userId);
        res.status(200).json({
            success: true,
            message: "User retrieved successfully",
            data: user,
            status: 200,
        });
    });
    public register = ApiHandler(async (req: Request, res: Response) => {
        const userData: CreateUserDTO = req.body;
        if (!userData.email || !userData.password || !userData.firstName) {
            throw AppError.badRequest("Missing required fields");
        }

        const user = await this.userService.createUser(userData);

        res.status(201).json({
            success: true,
            message: "User created successfully. Please verify your email.",
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    status: user.status,
                    isEmailVerified: user.isEmailVerified,
                },
            },
        });
    });

    public login = ApiHandler(async (req: Request, res: Response) => {
        const loginData: LoginDTO = {
            ...req.body,
            ip: req.ip || req.socket.remoteAddress || "unknown",
            userAgent: req.headers["user-agent"] || "unknown",
        };

        if (!loginData.email || !loginData.password) {
            throw AppError.badRequest("Email and password are required");
        }

        const loginResponse = await this.userService.loginUser(loginData);

        res.cookie("refreshToken", loginResponse.refreshToken, {
            httpOnly: true,
            secure: env.in_prod,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({
            success: true,
            message: "Login successful",
            data: {
                user: {
                    id: loginResponse.user.id,
                    email: loginResponse.user.email,
                    firstName: loginResponse.user.firstName,
                    lastName: loginResponse.user.lastName,
                    role: loginResponse.user.role,
                    status: loginResponse.user.status,
                    isEmailVerified: loginResponse.user.isEmailVerified,
                    lastLogin: loginResponse.user.lastLogin,
                },
                accessToken: loginResponse.accessToken,
                expiresIn: loginResponse.expiresIn,
            },
        });
    });

    public refreshToken = ApiHandler(async (req: Request, res: Response) => {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            throw AppError.unauthorized("Refresh token not provided");
        }

        const tokenResponse = await this.userService.refreshToken(refreshToken);

        res.json({
            success: true,
            message: "Token refreshed successfully",
            data: tokenResponse,
        });
    });

    public logout = ApiHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;

        if (!userId) {
            throw AppError.unauthorized("User not authenticated");
        }

        await this.userService.logoutUser(userId);

        res.clearCookie("refreshToken");

        res.json({
            success: true,
            message: "Logged out successfully",
        });
    });

    public changePassword = ApiHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        const { currentPassword, newPassword } = req.body;

        if (!userId) {
            throw AppError.unauthorized("User not authenticated");
        }

        if (!currentPassword || !newPassword) {
            throw AppError.badRequest(
                "Current password and new password are required",
            );
        }

        if (newPassword.length < 6) {
            throw AppError.badRequest(
                "New password must be at least 6 characters long",
            );
        }

        await this.userService.changePassword(userId, currentPassword, newPassword);

        res.json({
            success: true,
            message: "Password changed successfully",
        });
    });

    public requestPasswordReset = ApiHandler(
        async (req: Request, res: Response) => {
            const { email } = req.body;

            if (!email) {
                throw AppError.badRequest("Email is required");
            }

            await this.userService.requestPasswordReset(email);

            res.json({
                success: true,
                message: "Password reset instructions sent to your email",
            });
        },
    );

    public resetPassword = ApiHandler(async (req: Request, res: Response) => {
        const resetData: PasswordResetDTO = req.body;

        if ((!resetData.email  && !resetData.userId) || !resetData.token || !resetData.newPassword) {
            throw AppError.badRequest("Email, token, and new password are required");
        }

        if (resetData.newPassword.length < 6) {
            throw AppError.badRequest(
                "New password must be at least 6 characters long",
            );
        }

        await this.userService.resetPassword(resetData);

        res.json({
            success: true,
            message: "Password reset successfully",
        });
    });

    public verifyEmail = ApiHandler(async (req: Request, res: Response) => {
        const userId = req.params?.userId || req.body?.userId?.toString() || req?.body?.email?.toString();
        const token = req.params?.token || req.body?.token?.toString();

        if (!userId || !token) {
            throw AppError.badRequest("User ID and token are required");
        }

        const verifiedUser = await this.userService.verifyEmail(userId, token);

        res.cookie("refreshToken", verifiedUser.refreshToken, {
            httpOnly: true,
            secure: env.in_prod,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({
            success: true,
            message: "Email verified successfully",
            data: {
                user: {
                    id: verifiedUser.user.id,
                    email: verifiedUser.user.email,
                    firstName: verifiedUser.user.firstName,
                    lastName: verifiedUser.user.lastName,
                    role: verifiedUser.user.role,
                    status: verifiedUser.user.status,
                    isEmailVerified: verifiedUser.user.isEmailVerified,
                    lastLogin: verifiedUser.user.lastLogin,
                },
                accessToken: verifiedUser.accessToken,
                expiresIn: verifiedUser.expiresIn,
            }
        });
    });

    public resendEmailVerification = ApiHandler(
        async (req: Request, res: Response) => {
            const userId = req.user?.id || req?.body?.userId?.toString() || req?.body?.email?.toString();

            if (!userId) {
                throw AppError.unauthorized("User not authenticated");
            }

            await this.userService.resendEmailVerification(userId);

            res.json({
                success: true,
                message: "Verification email sent successfully",
                data: true
            });
        },
    );

    public getUserProfile = ApiHandler(async (req: Request, res: Response) => {
        const userId = req.params.id || req.user?.id;

        if (!userId) {
            throw AppError.badRequest("User ID is required");
        }

        const user = await this.userService.getUserProfile(userId);

        if (!user) {
            throw AppError.notFound("User not found");
        }

        res.json({
            success: true,
            message: "User profile retrieved successfully",
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phone: user.phone,
                    dateOfBirth: user.dateOfBirth,
                    gender: user.gender,
                    role: user.role,
                    status: user.status,
                    isEmailVerified: user.isEmailVerified,
                    isPhoneVerified: user.isPhoneVerified,
                    profileImage: user.profileImage,
                    addresses: user.addresses,
                    preferences: user.preferences,
                    referralCode: user.referralCode,
                    createdAt: user.createdAt,
                    lastLogin: user.lastLogin,
                    lastActiveAt: user.lastActiveAt,
                    metrics: user.metrics,
                },
            },
        });
    });

    public updateProfile = ApiHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        const updateData: UpdateUserDTO = req.body;

        if (!userId) {
            throw AppError.unauthorized("User not authenticated");
        }

        const user = await this.userService.updateProfile(userId, updateData);

        res.json({
            success: true,
            message: "Profile updated successfully",
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phone: user.phone,
                    dateOfBirth: user.dateOfBirth,
                    gender: user.gender,
                    profileImage: user.profileImage,
                },
            },
        });
    });

    public updatePreferences = ApiHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        const preferences = req.body;

        if (!userId) {
            throw AppError.unauthorized("User not authenticated");
        }

        const user = await this.userService.updatePreferences(userId, preferences);

        res.json({
            success: true,
            message: "Preferences updated successfully",
            data: {
                preferences: user.preferences,
            },
        });
    });

    public addAddress = ApiHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        const addressData: AddressDTO = req.body;

        if (!userId) {
            throw AppError.unauthorized("User not authenticated");
        }

        const user = await this.userService.addAddress(userId, addressData);

        res.status(201).json({
            success: true,
            message: "Address added successfully",
            data: {
                addresses: user.addresses,
            },
        });
    });

    public updateAddress = ApiHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        const { addressIndex } = req.params;
        const addressData: Partial<AddressDTO> = req.body;

        if (!userId) {
            throw AppError.unauthorized("User not authenticated");
        }

        const index = parseInt(addressIndex);
        if (isNaN(index)) {
            throw AppError.badRequest("Invalid address index");
        }

        const user = await this.userService.updateAddress(
            userId,
            index,
            addressData,
        );

        res.json({
            success: true,
            message: "Address updated successfully",
            data: {
                addresses: user.addresses,
            },
        });
    });

    public deleteAddress = ApiHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        const { addressIndex } = req.params;

        if (!userId) {
            throw AppError.unauthorized("User not authenticated");
        }

        const index = parseInt(addressIndex);
        if (isNaN(index)) {
            throw AppError.badRequest("Invalid address index");
        }

        const user = await this.userService.deleteAddress(userId, index);

        res.json({
            success: true,
            message: "Address deleted successfully",
            data: {
                addresses: user.addresses,
            },
        });
    });

    public updateUserStatus = ApiHandler(async (req: Request, res: Response) => {
        const { userId } = req.params;
        const { status, reason } = req.body;

        if (!userId) {
            throw AppError.badRequest("User ID is required");
        }

        if (!Object.values(UserStatus).includes(status)) {
            throw AppError.badRequest("Invalid status");
        }

        const user = await this.userService.updateUserStatus(
            userId,
            status,
            reason,
        );

        res.json({
            success: true,
            message: "User status updated successfully",
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    status: user.status,
                    blacklistedReason: user.blacklistedReason,
                },
            },
        });
    });

    public softDeleteUser = ApiHandler(async (req: Request, res: Response) => {
        const { userId } = req.params;

        if (!userId) {
            throw AppError.badRequest("User ID is required");
        }

        await this.userService.softDeleteUser(userId);

        res.json({
            success: true,
            message: "User deleted successfully",
        });
    });

    public restoreUser = ApiHandler(async (req: Request, res: Response) => {
        const { userId } = req.params;

        if (!userId) {
            throw AppError.badRequest("User ID is required");
        }

        const user = await this.userService.restoreUser(userId);

        res.json({
            success: true,
            message: "User restored successfully",
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    status: user.status,
                },
            },
        });
    });

    public getUserAnalytics = ApiHandler(async (_: Request, res: Response) => {
        const analytics = await this.userService.getUserAnalytics();

        res.json({
            success: true,
            message: "User analytics retrieved successfully",
            data: analytics,
        });
    });

    public deleteAccount = ApiHandler(async (req: Request, res: Response) => {
        const userId = req.user?.id;
        const { password } = req.body;

        if (!userId) {
            throw AppError.unauthorized("User not authenticated");
        }

        if (!password) {
            throw AppError.badRequest("Password is required to delete account");
        }

        await this.userService.softDeleteUser(userId);
        res.clearCookie("refreshToken");

        res.json({
            success: true,
            message: "Account deleted successfully",
        });
    });

    public updateUserMetrics = ApiHandler(async (req: Request, res: Response) => {
        const { userId } = req.params;
        const orderData = req.body;

        if (!userId) {
            throw AppError.badRequest("User ID is required");
        }

        if (!orderData.amount || !orderData.items) {
            throw AppError.badRequest("Order amount and items are required");
        }

        await this.userService.updateUserMetrics(userId, orderData);

        res.json({
            success: true,
            message: "User metrics updated successfully",
        });
    });
}
