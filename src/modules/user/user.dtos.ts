import { Address } from "cluster";
import { Gender, Preferences, User } from "./user.types";

export interface CreateUserDTO {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    dateOfBirth?: Date;
    gender?: Gender;
    referredBy?: string;
    marketingConsent?: boolean;
}

export interface UpdateUserDTO {
    firstName?: string;
    lastName?: string;
    phone?: string;
    dateOfBirth?: Date;
    gender?: Gender;
    profileImage?: string;
    preferences?: Partial<Preferences>;
}

export interface LoginDTO {
    email: string;
    password: string;
    rememberMe?: boolean;
    ip: string;
    userAgent: string;
}

export interface LoginResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export interface PasswordResetDTO {
    email: string;
    newPassword: string;
    token: string;
}

export interface AddressDTO extends Omit<Address, "isDefault" | "isActive"> {
    setAsDefault?: boolean;
}

export interface UserAnalytics {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
}
