import { env } from "../../config";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import * as crypto from "crypto";
import {
    AddressDTO,
    CreateUserDTO,
    LoginDTO,
    LoginResponse,
    PasswordResetDTO,
    UpdateUserDTO,
    UserAnalytics,
} from "./user.dtos";
import { UserRepository } from "./user.repository";
import {
    Address,
    AddressType,
    LoginAttempt,
    Preferences,
    User,
    UserStatus,
    VerificationToken,
} from "./user.types";
import { AppError } from "../../core/middleware/error.middleware";

export class UserService {
    private readonly JWT_SECRET = env.jwt_secret;
    private readonly JWT_EXPIRES_IN = "30d";
    private readonly REFRESH_TOKEN_EXPIRES_IN = "7d";
    private readonly BCRYPT_SALT_ROUNDS = 12;

    constructor(private readonly userRepository: UserRepository) { }

    async createUser(userData: CreateUserDTO): Promise<User> {
        const existingUser = await this.userRepository.findByEmail(
            userData.email.toLowerCase(),
        );
        if (existingUser) {
            throw AppError.conflict(
                `User with email ${userData.email} already exists, please login`,
            );
        }

        if (userData.phone) {
            const existingPhone = await this.userRepository.findOne({
                phone: userData.phone,
            });
            if (existingPhone) {
                throw AppError.conflict(
                    `User with phone number ${userData.phone} already exists, please login`,
                );
            }
        }

        const hashedPassword = await bcrypt.hash(
            userData.password,
            this.BCRYPT_SALT_ROUNDS,
        );

        const user = await this.userRepository.create({
            ...userData,
            password: hashedPassword,
            email: userData.email.toLowerCase(),
            referralCode: this.generateReferralCode(
                userData.firstName,
                userData.lastName,
            ),
            preferences: this.getDefaultPreferences(),
            status: UserStatus.PENDING_VERIFICATION,
        });

        const verificationToken = this.generateVerificationToken();
        user.verificationTokens.push({
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            token: verificationToken,
            type: "email",
        });

        const updatedUser = await this.userRepository.updateById(
            user.id,
            { verificationTokens: user.verificationTokens },
            { new: true },
        );

        if (!updatedUser) {
            throw AppError.internal("Failed to create user");
        }

        return updatedUser;
    }

    async loginUser(loginData: LoginDTO): Promise<LoginResponse> {
        const { email, password, ip, userAgent } = loginData;

        const user = await this.userRepository.findOne({
            email: email.toLowerCase(),
        });

        if (!user) {
            throw AppError.unauthorized("Invalid credentials");
        }

        if (this.isAccountLocked(user)) {
            throw AppError.badRequest(
                "Account temporarily locked due to multiple failed login attempts",
            );
        }

        if (user.status === UserStatus.SUSPENDED) {
            throw AppError.forbidden("Account is suspended");
        }

        if (user.status === UserStatus.BANNED) {
            throw AppError.forbidden("Account is banned");
        }

        if (user.status === UserStatus.DELETED) {
            throw AppError.forbidden("Account has been deleted");
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            await this.addLoginAttempt(user, ip, userAgent, false);
            throw AppError.unauthorized("Invalid credentials");
        }

        if (
            !user.isEmailVerified &&
            user.status !== UserStatus.PENDING_VERIFICATION
        ) {
            throw AppError.forbidden("Please verify your email address");
        }

        await this.addLoginAttempt(user, ip, userAgent, true);

        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);

        const updatedUser = await this.userRepository.updateById(user.id, {
            lastLogin: new Date(),
            lastActiveAt: new Date(),
        });

        if (!updatedUser) {
            throw AppError.internal("Failed to update user login information");
        }

        return {
            user: updatedUser,
            accessToken,
            refreshToken,
            expiresIn: this.getTokenExpiration(this.JWT_EXPIRES_IN),
        };
    }

    async refreshToken(
        refreshToken: string,
    ): Promise<{ accessToken: string; expiresIn: number }> {
        try {
            const decoded = jwt.verify(refreshToken, this.JWT_SECRET) as any;
            const user = await this.userRepository.findById(decoded.userId);

            if (!user || user.status !== UserStatus.ACTIVE) {
                throw AppError.unauthorized("Invalid refresh token");
            }

            const accessToken = this.generateAccessToken(user);
            return {
                accessToken,
                expiresIn: this.getTokenExpiration(this.JWT_EXPIRES_IN),
            };
        } catch (error) {
            throw AppError.unauthorized("Invalid refresh token");
        }
    }

    async logoutUser(userId: string): Promise<void> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw AppError.notFound("User not found");
        }

        await this.userRepository.updateById(userId, {
            lastActiveAt: new Date(),
        });
    }

    async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string,
    ): Promise<void> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw AppError.notFound("User not found");
        }

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            throw AppError.badRequest("Current password is incorrect");
        }

        const hashedNewPassword = await bcrypt.hash(
            newPassword,
            this.BCRYPT_SALT_ROUNDS,
        );
        const updatedUser = await this.userRepository.updateById(userId, {
            password: hashedNewPassword,
        });

        if (!updatedUser) {
            throw AppError.internal("Failed to update password");
        }
    }

    async requestPasswordReset(email: string): Promise<void> {
        const user = await this.userRepository.findOne({
            email: email.toLowerCase(),
        });

        if (!user) {
            return;
        }

        const token = this.generateVerificationToken();
        user.verificationTokens.push({
            token,
            type: "password_reset",
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        const updatedUser = await this.userRepository.updateById(user.id, {
            verificationTokens: user.verificationTokens,
        });

        if (!updatedUser) {
            throw AppError.internal("Failed to create password reset token");
        }
    }

    async resetPassword(resetData: PasswordResetDTO): Promise<void> {
        const user = await this.userRepository.findOne({
            email: resetData.email.toLowerCase(),
        });

        if (!user) {
            throw AppError.badRequest("Invalid reset token");
        }

        if (!this.isTokenValid(user, resetData.token, "password_reset")) {
            throw AppError.badRequest("Invalid or expired reset token");
        }

        const hashedPassword = await bcrypt.hash(
            resetData.newPassword,
            this.BCRYPT_SALT_ROUNDS,
        );
        this.markTokenAsUsed(user, resetData.token);

        const updatedUser = await this.userRepository.updateById(user.id, {
            password: hashedPassword,
            verificationTokens: user.verificationTokens,
        });

        if (!updatedUser) {
            throw AppError.internal("Failed to reset password");
        }
    }

    async verifyEmail(userId: string, token: string): Promise<void> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw AppError.notFound("User not found");
        }

        if (!this.isTokenValid(user, token, "email")) {
            throw AppError.badRequest("Invalid or expired verification token");
        }

        this.markTokenAsUsed(user, token);

        const updatedUser = await this.userRepository.updateById(userId, {
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
            status: UserStatus.ACTIVE,
            verificationTokens: user.verificationTokens,
        });

        if (!updatedUser) {
            throw AppError.internal("Failed to verify email");
        }
    }

    async resendEmailVerification(userId: string): Promise<void> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw AppError.notFound("User not found");
        }

        if (user.isEmailVerified) {
            throw AppError.badRequest("Email already verified");
        }

        const token = this.generateVerificationToken();
        user.verificationTokens.push({
            token,
            type: "email",
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        const updatedUser = await this.userRepository.updateById(userId, {
            verificationTokens: user.verificationTokens,
        });

        if (!updatedUser) {
            throw AppError.internal("Failed to create verification token");
        }
    }

    async updateProfile(
        userId: string,
        updateData: UpdateUserDTO,
    ): Promise<User> {
        const user = await this.userRepository.updateById(userId, updateData);
        if (!user) {
            throw AppError.notFound("User not found");
        }

        return user;
    }

    async updatePreferences(
        userId: string,
        preferences: Partial<Preferences>,
    ): Promise<User> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw AppError.notFound("User not found");
        }

        const updatedPreferences = { ...user.preferences, ...preferences };
        const updatedUser = await this.userRepository.updateById(userId, {
            preferences: updatedPreferences,
        });

        if (!updatedUser) {
            throw AppError.internal("Failed to update preferences");
        }

        return updatedUser;
    }

    async addAddress(userId: string, addressData: AddressDTO): Promise<User> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw AppError.notFound("User not found");
        }

        if (addressData.setAsDefault) {
            user.addresses.forEach((addr) => {
                if (addr.type === (addressData.addressType as AddressType)) {
                    addr.isDefault = false;
                }
            });
        }

        const newAddress = {
            ...addressData,
            isDefault: addressData.setAsDefault || false,
            isActive: true,
        } as unknown as Address;

        user.addresses.push(newAddress);

        const updatedUser = await this.userRepository.updateById(userId, {
            addresses: user.addresses,
        });

        if (!updatedUser) {
            throw AppError.internal("Failed to add address");
        }

        return updatedUser;
    }

    async updateAddress(
        userId: string,
        addressIndex: number,
        addressData: Partial<AddressDTO>,
    ): Promise<User> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw AppError.notFound("User not found");
        }

        if (addressIndex < 0 || addressIndex >= user.addresses.length) {
            throw AppError.badRequest("Address not found");
        }

        Object.assign(user.addresses[addressIndex], addressData);

        if (addressData.setAsDefault) {
            user.addresses.forEach((addr, index) => {
                if (
                    index !== addressIndex &&
                    addr.type === user.addresses[addressIndex].type
                ) {
                    addr.isDefault = false;
                }
            });
            user.addresses[addressIndex].isDefault = true;
        }

        const updatedUser = await this.userRepository.updateById(userId, {
            addresses: user.addresses,
        });

        if (!updatedUser) {
            throw AppError.internal("Failed to update address");
        }

        return updatedUser;
    }

    async deleteAddress(userId: string, addressIndex: number): Promise<User> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw AppError.notFound("User not found");
        }

        if (addressIndex < 0 || addressIndex >= user.addresses.length) {
            throw AppError.badRequest("Address not found");
        }

        user.addresses.splice(addressIndex, 1);

        const updatedUser = await this.userRepository.updateById(userId, {
            addresses: user.addresses,
        });

        if (!updatedUser) {
            throw AppError.internal("Failed to delete address");
        }

        return updatedUser;
    }

    async getUserProfile(userId: string): Promise<User | null> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            return null;
        }

        await this.userRepository.updateById(userId, {
            lastActiveAt: new Date(),
        });

        return user;
    }

    async updateUserStatus(
        userId: string,
        status: UserStatus,
        reason?: string,
    ): Promise<User> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw AppError.notFound("User not found");
        }

        const updateData: any = { status };

        if (status === UserStatus.BANNED && reason) {
            updateData.blacklistedReason = reason;
        }

        const updatedUser = await this.userRepository.updateById(
            userId,
            updateData,
        );

        if (!updatedUser) {
            throw AppError.internal("Failed to update user status");
        }

        return updatedUser;
    }

    async softDeleteUser(userId: string): Promise<void> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw AppError.notFound("User not found");
        }

        const updatedUser = await this.userRepository.updateById(userId, {
            deletedAt: new Date(),
            status: UserStatus.DELETED,
            email: `deleted_${user.id}@deleted.com`,
        });

        if (!updatedUser) {
            throw AppError.internal("Failed to delete user");
        }
    }

    async restoreUser(userId: string): Promise<User> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw AppError.notFound("User not found");
        }

        const updatedUser = await this.userRepository.updateById(userId, {
            deletedAt: undefined,
            status: UserStatus.ACTIVE,
        });

        if (!updatedUser) {
            throw AppError.internal("Failed to restore user");
        }

        return updatedUser;
    }

    async getUserAnalytics(): Promise<UserAnalytics> {
        const now = new Date();
        const startOfToday = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
        );
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - 7);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        try {
            const [
                totalUsers,
                activeUsers,
                newUsersToday,
                newUsersThisWeek,
                newUsersThisMonth,
            ] = await Promise.all([
                this.userRepository.count({ deletedAt: { $exists: false } }),
                this.userRepository.count({
                    status: UserStatus.ACTIVE,
                    deletedAt: { $exists: false },
                }),
                this.userRepository.count({ createdAt: { $gte: startOfToday } }),
                this.userRepository.count({ createdAt: { $gte: startOfWeek } }),
                this.userRepository.count({ createdAt: { $gte: startOfMonth } }),
            ]);

            return {
                totalUsers,
                activeUsers,
                newUsersToday,
                newUsersThisWeek,
                newUsersThisMonth,
            };
        } catch (error) {
            throw AppError.internal("Failed to get user analytics");
        }
    }

    async updateUserMetrics(
        userId: string,
        orderData: { amount: number; items: number },
    ): Promise<void> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw AppError.notFound("User not found");
        }

        const newTotalOrders = user.metrics.totalOrders + 1;
        const newTotalSpent = user.metrics.totalSpent + orderData.amount;

        const updatedUser = await this.userRepository.updateById(userId, {
            metrics: {
                ...user.metrics,
                totalOrders: newTotalOrders,
                totalSpent: newTotalSpent,
                averageOrderValue: newTotalSpent / newTotalOrders,
                lastOrderDate: new Date(),
                lifetimeValue: newTotalSpent,
            },
        });

        if (!updatedUser) {
            throw AppError.internal("Failed to update user metrics");
        }
    }

    private generateReferralCode(firstName: string, lastName: string): string {
        const name = (firstName + lastName).replace(/[^a-zA-Z]/g, "").toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `${name.substring(0, 3)}${random}`;
    }

    private generateVerificationToken(): string {
        const token = crypto.randomBytes(32).toString("hex");
        return token;
    }

    private isTokenValid(
        user: User,
        token: string,
        type: VerificationToken["type"],
    ): boolean {
        const tokenDoc = user.verificationTokens.find(
            (t: VerificationToken) =>
                t.token === token && t.type === type && !t.usedAt,
        );
        return tokenDoc ? tokenDoc.expiresAt > new Date() : false;
    }

    private markTokenAsUsed(user: User, token: string): void {
        const tokenDoc = user.verificationTokens.find(
            (t: VerificationToken) => t.token === token,
        );
        if (tokenDoc) {
            tokenDoc.usedAt = new Date();
        }
    }

    private async addLoginAttempt(
        user: User,
        ip: string,
        userAgent: string,
        success: boolean,
    ): Promise<void> {
        user.loginAttempts.push({
            ip,
            userAgent,
            success,
            timestamp: new Date(),
        });

        if (user.loginAttempts.length > 10) {
            user.loginAttempts = user.loginAttempts.slice(-10);
        }

        await this.userRepository.updateById(user.id, {
            loginAttempts: user.loginAttempts,
        });
    }

    private isAccountLocked(user: User): boolean {
        const hourAgo = new Date();
        hourAgo.setHours(hourAgo.getHours() - 1);

        const recentFailedAttempts = user.loginAttempts.filter(
            (attempt: LoginAttempt) =>
                !attempt.success && attempt.timestamp > hourAgo,
        );

        return recentFailedAttempts.length >= 5;
    }

    private generateAccessToken(user: User): string {
        return jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
            },
            this.JWT_SECRET,
            { expiresIn: this.JWT_EXPIRES_IN },
        );
    }

    private generateRefreshToken(user: User): string {
        return jwt.sign({ userId: user.id }, this.JWT_SECRET, {
            expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
        });
    }

    private getTokenExpiration(expiresIn: string): number {
        const match = expiresIn.match(/^(\d+)([smhd])$/);
        if (!match) return 1800;

        const value = parseInt(match[1]);
        const unit = match[2];

        switch (unit) {
            case "s":
                return value;
            case "m":
                return value * 60;
            case "h":
                return value * 3600;
            case "d":
                return value * 86400;
            default:
                return 1800;
        }
    }

    private getDefaultPreferences(): Preferences {
        return {
            communications: {
                email: {
                    marketing: true,
                    orderUpdates: true,
                    promotions: true,
                    newsletter: false,
                    productRecommendations: true,
                },
                sms: {
                    marketing: false,
                    orderUpdates: true,
                    promotions: false,
                    newsletter: false,
                    productRecommendations: false,
                },
                push: {
                    marketing: true,
                    orderUpdates: true,
                    promotions: true,
                    newsletter: false,
                    productRecommendations: true,
                },
                phone: {
                    marketing: false,
                    orderUpdates: false,
                    promotions: false,
                    newsletter: false,
                    productRecommendations: false,
                },
            },
            shopping: {
                currency: "USD",
                language: "en",
                timezone: "UTC",
            },
            display: {
                theme: "light",
            },
        };
    }
}
