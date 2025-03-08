import JWT from 'jsonwebtoken';
import bcrypt from "bcrypt"
import { TUser } from "../../../data/entity/user";
import { ID } from "../../../shared/entity";
import { EStatusCodes } from "../../../shared/enum";
import { handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { validateData } from "../../../util/functions";
import { logger } from "../../../util/logger";
import { IUserRepository } from "../../user/repository";
import { CreateUserUseCase } from "../../user/use-case/create-user";
import { AutUseCaseRepository, TokenPair } from "../repository";
import { env } from '../../../config/env';
import { SignInDTO, SignInSchema, SignUpDTO, SignUpSchema, SocialSignInDTO, SocialSignInSchema } from '../../../data/dto/auth';
import { CreateUserDTO } from '../../../data/dto/user';


export default class AuthUseCase extends AutUseCaseRepository {
  constructor(private readonly userRepository: IUserRepository, private readonly createNewUser: CreateUserUseCase) {
    super()
    this.signUp = this.signUp.bind(this);
    this.signIn = this.signIn.bind(this);
    this.socialSignIn = this.socialSignIn.bind
    this.signOut = this.signOut.bind(this);
    this.signJWT = this.signJWT.bind(this);
    this.decodeJWT = this.decodeJWT.bind(this);
    this.generateTokens = this.generateTokens.bind(this);
    this.hashPassword = this.hashPassword.bind(this);
    this.verifyPassword = this.verifyPassword.bind(this);
  }

  async signUp(data: SignUpDTO): Promise<UseCaseResult<TUser>> {
    try {

      const validate = validateData<SignUpDTO>(data, SignUpSchema)
      if (!validate.success) {
        return handleUseCaseError({ error: validate.error, title: "Signup", status: EStatusCodes.enum.badRequest })
      }

      const created = await this.createNewUser.execute(data)
      if (!created.success) {
        return handleUseCaseError({ error: created.error, title: "SignUp" })
      }
      const loggedIn = await this.getUserTokens(created.data)
      if (!loggedIn) {
        return handleUseCaseError({
          title: "Signin",
          error: "An unexpected error occurred"
        })
      }
      return ({
        data: loggedIn,
        success: true
      });
    } catch (error) {
      return handleUseCaseError({ title: "Sign Up" })
    }
  }
  async signIn(data: SignInDTO): Promise<UseCaseResult<TUser>> {
    try {
      const validate = validateData<SignInDTO>(data, SignInSchema)
      if (!validate.success) {
        return handleUseCaseError({ error: "Invalid email or password", title: "SignIn" })
      }

      const exists = await this.userRepository.findByEmail(validate.data.email);

      if (!exists) {
        return handleUseCaseError({ error: "Invalid Email or Password", title: "SignIn" })
      }
      const password = await this.userRepository.getPasswordHash(exists.id!)
      const matched = await this.verifyPassword(validate.data.password, password!)

      if (!matched) {
        return handleUseCaseError({ error: "Incorrect Email or Password", title: "SignIn" })
      }

      const loggedIn = await this.getUserTokens(exists)
      if (!loggedIn) {
        return handleUseCaseError({ error: "An unexpected error occurred", title: "SignIn" })
      }
      return ({
        data: loggedIn,
        success: true
      });
    } catch (error) {
      return handleUseCaseError({ title: "SignIn" })
    }
  }

  async socialSignIn(data: SocialSignInDTO): Promise<UseCaseResult<TUser>> {
    try {
      const validated = validateData<SocialSignInDTO>(data, SocialSignInSchema)
      if (!validated.success) {
        return handleUseCaseError({ error: validated.error, title: "Social Sign In", status: EStatusCodes.enum.badRequest })
      }

      let user = await this.userRepository.findByEmail(validated.data.email)

      if (!user) {
        const newUserData: CreateUserDTO = {
          ...validated.data,
          externalProvider: validated.data.oauth.provider,
          profilePictureUrl: {
            external: true,
            url: validated.data.profilePictureUrl?.url,
          }
        }
        const createNew = await this.createNewUser.execute(newUserData)
        if (!createNew.success)
          return handleUseCaseError({
            title: "Signin",
            error: `${validated.data.oauth.provider} Signin Failed`
          })

        user = createNew.data
      }

      const loggedIn = await this.getUserTokens(user)
      if (!loggedIn) {
        return handleUseCaseError({
          title: "Signin",
          error: `${validated.data.oauth.provider} Signin Failed`
        })
      }
      return ({
        data: loggedIn,
        success: true
      });
    } catch (error) {
      return handleUseCaseError({
        title: "Signin",
        error: `${data.oauth.provider} Signin Failed`
      })
    }
  }

  private async getUserTokens(user: TUser) {
    const tokenData = {
      firstName: user?.firstName,
      lastName: user?.lastName,
      id: user?.id,
      profilePictureUrl: user?.profilePictureUrl,
      email: user.email,
      roles: user?.roles
    }
    const tokens = this.generateTokens(tokenData);

    const loggedIn = await this.userRepository.update(user?.id!, {
      tokenPair: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      }
    });
    return loggedIn
  }
  async signOut(userId: ID): Promise<void> {
    try {
      await this.userRepository.update(userId, {
        tokenPair: {
          accessToken: undefined,
          refreshToken: undefined,
          provider: undefined
        }
      });
    } catch (error: unknown) {
      throw error
    }
  }

  signJWT(payload: Partial<TUser>, expiresIn: number): string {
    const token = JWT.sign(payload, env.jwt_secret, {
      expiresIn: expiresIn,
    });
    return token;
  }

  decodeJWT(token: string): Partial<TUser> | null {
    const decoded = JWT.decode(token);
    if (decoded && typeof decoded === 'object') {
      return decoded as Partial<TUser>
    }
    return null;
  }


  generateTokens(user: Pick<TUser, "id" | "roles" | "email" | "profilePictureUrl" | "firstName" | "lastName">): TokenPair {
    const refreshToken = this.signJWT(user, 12 * 4 * 7 * 24 * 60 * 60);
    const accessToken = this.signJWT(user, 24 * 60 * 60);
    return { refreshToken, accessToken };
  }
  async hashPassword(password: string): Promise<string | null> {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);
      return hashed;
    } catch (err) {
      logger.error("Error Hashing Password", err);
      throw new Error("Error hashing password");
    }
  }
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const matched = await bcrypt.compare(password, hash);
    return matched;
  }

}
