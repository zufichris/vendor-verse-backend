import { TUser } from '../../../data/entity/user';
import { UseCaseResult } from '../../../shared/use-case';
import { ID } from '../../../shared/entity';
import { SignInDTO, SignUpDTO, SocialSignInDTO } from '../../../data/dto/auth';

export type TokenPair = { accessToken: string, refreshToken: string }

export interface IAuthUseCaseRepository {
    signUp(data: SignUpDTO): Promise<UseCaseResult<TUser>>
    signIn(data: SignInDTO): Promise<UseCaseResult<TUser>>
    signOut(userId: ID): Promise<void>
    socialSignIn(data: SocialSignInDTO): Promise<UseCaseResult<TUser>>
    // verifyAccount(userId: ID): Promise<TUser | null>
    verifyPassword(password: string, hash: string): Promise<boolean>
    // resetPassword(userId: ID): Promise<TUser | null>
    // changePassword(userId: ID, oldPassword: string, newPassword: string): Promise<boolean>
    // revokeToken(userId: ID): Promise<void>
    // forgotPassword(email: string): Promise<boolean>
    signJWT(payload: Partial<TUser>, expiresIn: number): string
    decodeJWT(token: string): Partial<TUser> | null
    generateTokens(user: Pick<TUser, "id" | "roles" | "email" | "profilePictureUrl" | "firstName" | "lastName">): TokenPair
    hashPassword(password: string): Promise<string | null>
}
export abstract class AutUseCaseRepository implements IAuthUseCaseRepository {
    abstract signUp(data: SignUpDTO): Promise<UseCaseResult<TUser>>
    abstract signIn(data: SignInDTO): Promise<UseCaseResult<TUser>>
    abstract signOut(userId: ID): Promise<void>;
    abstract socialSignIn(data: SocialSignInDTO): Promise<UseCaseResult<TUser>>
    // abstract changePassword(userId: ID, oldPassword: string, newPassword: string): Promise<boolean>
    // abstract forgotPassword(email: string): Promise<boolean>;
    // abstract resetPassword(userId: ID): Promise<TUser | null>;
    // abstract revokeToken(userId: ID): Promise<void>;
    // abstract verifyAccount(userId: ID): Promise<TUser | null>;
    abstract signJWT(payload: Partial<TUser>, expiresIn: number): string
    abstract decodeJWT(token: string): Partial<TUser> | null
    abstract generateTokens(user: Pick<TUser, "id" | "roles" | "email" | "profilePictureUrl" | "firstName" | "lastName">): TokenPair
    abstract hashPassword(password: string): Promise<string | null>
    abstract verifyPassword(password: string, hash: string): Promise<boolean>;
}

