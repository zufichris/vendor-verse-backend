import { Address } from "cluster";
import { Gender, Preferences, User, UserStatus } from "./user.types";
import z from "zod";
import { PaginationOptionsDtoSchema, SortOptionsDtoSchema } from "../../core/dtos";

export const QueryUsersDtoSchema = z.object({
    id: z.string().optional(),
    search: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    role: z.string().optional(),
    status: z.enum([UserStatus.ACTIVE, ...Object.values(UserStatus)]).optional()
}).merge(PaginationOptionsDtoSchema).merge(SortOptionsDtoSchema([]))

export type QueryUersDTO = z.infer<typeof QueryUsersDtoSchema>

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
    callbackUrl?: string
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
    callbackUrl?: string
}

export interface LoginResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export interface PasswordResetDTO {
    email?: string;
    userId?: string;
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
