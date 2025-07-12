import mongoose, { Document, Schema } from "mongoose";
import {
    Address,
    AddressType,
    CommunicationChannel,
    Gender,
    LoginAttempt,
    Preferences,
    SocialAccount,
    User,
    UserMetrics,
    UserRole,
    UserStatus,
    VerificationToken,
} from "./user.types";

export interface UserDocument extends Omit<User, "id">, Document {
    comparePassword(candidatePassword: string): Promise<boolean>;
    isTokenValid(token: string, type: VerificationToken["type"]): boolean;
    markTokenAsUsed(token: string): void;
    addLoginAttempt(ip: string, userAgent: string, success: boolean): void;
    getDefaultAddress(type?: AddressType): Address | null;
    updateMetrics(): Promise<void>;
    canReceiveNotification(channel: CommunicationChannel, type: string): boolean;
    isAccountLocked(): boolean;
    getReferralCode(): string;
    softDelete(): Promise<void>;
    restore(): Promise<void>;
}

const addressSchema = new Schema<AddressType>(
    {
        type: {
            type: String,
            enum: Object.values(AddressType),
            required: true,
        },
        label: String,
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        company: { type: String, trim: true },
        addressLine1: { type: String, required: true, trim: true },
        addressLine2: { type: String, trim: true },
        city: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true },
        country: { type: String, required: true, trim: true },
        postalCode: { type: String, required: true, trim: true },
        phone: { type: String, trim: true },
        isDefault: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        deliveryInstructions: { type: String, trim: true },
        coordinates: {
            latitude: Number,
            longitude: Number,
        },
    },
    { _id: false, timestamps: true },
);

const socialAccountSchema = new Schema<SocialAccount>(
    {
        provider: {
            type: String,
            enum: ["google", "facebook", "apple", "twitter", "linkedin"],
            required: true,
        },
        providerId: { type: String, required: true },
        email: String,
        isVerified: { type: Boolean, default: false },
        connectedAt: { type: Date, default: Date.now },
    },
    { _id: false },
);

const loginAttemptSchema = new Schema<LoginAttempt>(
    {
        ip: { type: String, required: true },

        userAgent: { type: String, required: true },
        success: { type: Boolean, required: true },
        timestamp: { type: Date, default: Date.now },
        location: {
            country: String,
            city: String,
        },
    },
    { _id: false },
);

const verificationTokenSchema = new Schema<VerificationToken>(
    {
        token: { type: String, required: true },
        type: {
            type: String,
            enum: ["email", "phone", "password_reset", "account_deletion"],
            required: true,
        },
        expiresAt: { type: Date, required: true },
        usedAt: Date,
    },
    { _id: false },
);

const userMetricsSchema = new Schema<UserMetrics>(
    {
        totalOrders: { type: Number, default: 0 },
        totalSpent: { type: Number, default: 0 },
        averageOrderValue: { type: Number, default: 0 },
        lastOrderDate: Date,
        favoriteCategories: [String],
        lifetimeValue: { type: Number, default: 0 },
        loyaltyPoints: { type: Number, default: 0 },
        referralsCount: { type: Number, default: 0 },
        reviewsCount: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 },
    },
    { _id: false },
);

const preferencesSchema = new Schema<Preferences>(
    {
        communications: {
            email: {
                marketing: { type: Boolean, default: true },
                orderUpdates: { type: Boolean, default: true },
                promotions: { type: Boolean, default: true },
                newsletter: { type: Boolean, default: false },
                productRecommendations: { type: Boolean, default: true },
            },
            sms: {
                marketing: { type: Boolean, default: false },
                orderUpdates: { type: Boolean, default: true },
                promotions: { type: Boolean, default: false },
                newsletter: { type: Boolean, default: false },
                productRecommendations: { type: Boolean, default: false },
            },
            push: {
                marketing: { type: Boolean, default: true },
                orderUpdates: { type: Boolean, default: true },
                promotions: { type: Boolean, default: true },
                newsletter: { type: Boolean, default: false },
                productRecommendations: { type: Boolean, default: true },
            },
            phone: {
                marketing: { type: Boolean, default: false },
                orderUpdates: { type: Boolean, default: false },
                promotions: { type: Boolean, default: false },
                newsletter: { type: Boolean, default: false },
                productRecommendations: { type: Boolean, default: false },
            },
        },
        shopping: {
            currency: { type: String, default: "USD" },
            language: { type: String, default: "en" },
            timezone: { type: String, default: "UTC" },
            defaultPaymentMethod: String,
            defaultShippingAddress: String,
        },
        display: {
            theme: {
                type: String,
                enum: ["light", "dark", "auto"],
                default: "light",
            },
        },
    },
    { _id: false },
);

const userSchema = new Schema<UserDocument>(
    {
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        phone: { type: String, trim: true, sparse: true },
        dateOfBirth: Date,
        gender: {
            type: String,
            enum: Object.values(Gender),
        },
        profileImage: String,
        password: { type: String, required: true },
        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.CUSTOMER,
        },
        status: {
            type: String,
            enum: Object.values(UserStatus),
            default: UserStatus.PENDING_VERIFICATION,
            index: true,
        },
        isEmailVerified: { type: Boolean, default: false },
        isPhoneVerified: { type: Boolean, default: false },
        emailVerifiedAt: Date,
        phoneVerifiedAt: Date,
        lastLogin: Date,
        lastPasswordChange: Date,
        twoFactorEnabled: { type: Boolean, default: false },
        twoFactorSecret: String,
        loginAttempts: [loginAttemptSchema],
        socialAccounts: [socialAccountSchema],
        addresses: [addressSchema],
        preferences: { type: preferencesSchema, default: {} },
        verificationTokens: [verificationTokenSchema],
        metrics: { type: userMetricsSchema, default: {} },
        lastActiveAt: Date,
        deletedAt: Date,
        referralCode: {
            type: String,
            unique: true,
            sparse: true,
            index: true,
        },
        referredBy: String,
        blacklistedReason: String,
    },
    {
        timestamps: true,
        toJSON: {
            transform: function(_, ret) {
                delete ret.password;
                delete ret.twoFactorSecret;
                delete ret.verificationTokens;
                return ret;
            },
        },
    },
);

userSchema.index({ email: 1, status: 1 });

export const UserModel =
    mongoose.models.User || mongoose.model("User", userSchema);
