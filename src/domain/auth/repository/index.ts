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
    verifyPassword(password: string, hash: string): Promise<boolean>
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
    abstract signJWT(payload: Partial<TUser>, expiresIn: number): string
    abstract decodeJWT(token: string): Partial<TUser> | null
    abstract generateTokens(user: Pick<TUser, "id" | "roles" | "email" | "profilePictureUrl" | "firstName" | "lastName">): TokenPair
    abstract hashPassword(password: string): Promise<string | null>
    abstract verifyPassword(password: string, hash: string): Promise<boolean>;
}

