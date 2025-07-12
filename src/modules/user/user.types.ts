export enum UserStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended",
    PENDING_VERIFICATION = "pending_verification",
    BANNED = "banned",
    DELETED = "deleted",
}

export enum Gender {
    MALE = "male",
    FEMALE = "female",
    OTHER = "other",
    PREFER_NOT_TO_SAY = "prefer_not_to_say",
}

export enum AddressType {
    HOME = "home",
    WORK = "work",
    BILLING = "billing",
    SHIPPING = "shipping",
    OTHER = "other",
}

export enum UserRole {
    CUSTOMER = "customer",
    ADMIN = "admin",
    MODERATOR = "moderator",
    SUPPORT = "support",
    VENDOR = "vendor",
}

export enum CommunicationChannel {
    EMAIL = "email",
    SMS = "sms",
    PUSH = "push",
    PHONE = "phone",
}

export interface Address {
    type: AddressType;
    label?: string;
    firstName: string;
    lastName: string;
    company?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phone?: string;
    isDefault: boolean;
    isActive: boolean;
    deliveryInstructions?: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
}

export interface Preferences {
    communications: {
        [key in CommunicationChannel]: {
            marketing: boolean;
            orderUpdates: boolean;
            promotions: boolean;
            newsletter: boolean;
            productRecommendations: boolean;
        };
    };
    shopping: {
        currency: string;
        language: string;
        timezone: string;
        defaultPaymentMethod?: string;
        defaultShippingAddress?: string;
    };

    display: {
        theme: "light" | "dark" | "auto";
    };
}

export interface SocialAccount {
    provider: "google" | "facebook" | "apple" | "twitter" | "linkedin";
    providerId: string;
    email?: string;
    isVerified: boolean;
    connectedAt: Date;
}

export interface LoginAttempt {
    ip: string;
    userAgent: string;
    success: boolean;
    timestamp: Date;
    location?: {
        country: string;
        city: string;
    };
}

export interface VerificationToken {
    token: string;
    type: "email" | "phone" | "password_reset" | "account_deletion";
    expiresAt: Date;
    usedAt?: Date;
}

export interface UserMetrics {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate?: Date;
    favoriteCategories: string[];
    lifetimeValue: number;
    loyaltyPoints: number;
    referralsCount: number;
    reviewsCount: number;
    averageRating: number;
}

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: Date;
    gender?: Gender;
    profileImage?: string;
    password: string;
    role: UserRole;
    status: UserStatus;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    emailVerifiedAt?: Date;
    phoneVerifiedAt?: Date;
    lastLogin?: Date;
    lastPasswordChange?: Date;
    twoFactorEnabled: boolean;
    twoFactorSecret?: string;
    loginAttempts: LoginAttempt[];
    socialAccounts: SocialAccount[];
    addresses: Address[];
    preferences: Preferences;
    verificationTokens: VerificationToken[];
    metrics: UserMetrics;
    createdAt: Date;
    updatedAt: Date;
    lastActiveAt?: Date;
    deletedAt?: Date;
    referralCode: string;
    referredBy?: string;
    blacklistedReason?: string;
}
