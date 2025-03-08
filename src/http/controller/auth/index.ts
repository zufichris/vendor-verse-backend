import { Response, Request, NextFunction, CookieOptions } from "express";
import { GoogleAuthConfig } from "../../../config/google";
import AuthUseCase from "../../../domain/auth/use-case";
import { GoogleAuthControllers } from "./GoogleAuth";
import { validateData } from "../../../util/functions";
import { EStatusCodes } from "../../../shared/enum";
import { IResponseData } from "../../../shared/entity";
import { TUser } from "../../../data/entity/user";
import { UserRepositoryImpl } from "../../../data/orm/repository-implementation/user";
import { UserModel } from "../../../data/orm/model/user";
import { CreateUserUseCase } from "../../../domain/user/use-case/create-user";
import { IAuthUseCaseRepository } from "../../../domain/auth/repository";
import { SignInDTO, SignInSchema, SignUpDTO, SignUpSchema, SocialSignInDTO, SocialSignInSchema } from "../../../data/dto/auth";

export class AuthControllers {
  public googleAuthControllers = new GoogleAuthControllers(GoogleAuthConfig);

  constructor(private readonly authUseCase: IAuthUseCaseRepository) {
    this.signUp = this.signUp.bind(this);
    this.signIn = this.signIn.bind(this);
    this.socialSignIn = this.socialSignIn.bind(this);
    this.signOut = this.signOut.bind(this);
    this.setCookies = this.setCookies.bind(this);
    this.clearCookies = this.clearCookies.bind(this);
  }

  private generateMetadata(req: Request, message: string, type?: string) {
    return {
      url: req.url,
      path: req.path,
      type: type ?? "Auth",
      message,
    };
  }

  async signUp(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = validateData<SignUpDTO>(req.body, SignUpSchema);
      if (!validation.success) {
        const data: IResponseData<null> = {
          ...this.generateMetadata(req, `Invalid Data-${validation.error}`),
          status: EStatusCodes.enum.badRequest,
          success: false,
        };
        res.status(EStatusCodes.enum.badRequest).json(data);
        return
      }

      const result = await this.authUseCase.signUp(validation.data);
      if (!result.success) {
        const data: IResponseData<null> = {
          ...this.generateMetadata(req, result.error),
          status: result.status ?? EStatusCodes.enum.conflict,
          success: false,
        };
        res.status(data.status).json(data);
        return
      }

      const data: IResponseData<TUser> = {
        ...this.generateMetadata(req, "Signup successful"),
        status: EStatusCodes.enum.created,
        success: true,
        data: result.data,
      };
      res.status(data.status).json(data);
    } catch (error) {
      next(error);
    }
  }
  async signIn(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = validateData<SignInDTO>(req.body, SignInSchema);
      if (!validation.success) {
        const data: IResponseData<null> = {
          ...this.generateMetadata(req, "Invalid email or password"),
          status: EStatusCodes.enum.badRequest,
          success: false,
        };
        res.status(EStatusCodes.enum.badRequest).json(data);
        return
      }
      const result = await this.authUseCase.signIn(validation.data);
      if (!result.success) {
        const data: IResponseData<null> = {
          ...this.generateMetadata(req, result.error),
          status: result.status ?? EStatusCodes.enum.unauthorized,
          success: false,
        };
        res.status(data.status).json(data);
        return
      }

      const data: IResponseData<TUser> = {
        ...this.generateMetadata(req, "Signin successful"),
        status: EStatusCodes.enum.ok,
        success: true,
        data: result.data,
      };

      this.setCookies(
        res,
        result.data.tokenPair?.accessToken as string,
        result.data.tokenPair?.refreshToken as string
      )
        .status(data.status)
        .json(data);
    } catch (error) {
      next(error);
    }
  }

  async socialSignIn(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = validateData<SocialSignInDTO>(
        req.body,
        SocialSignInSchema
      );
      if (!validation.success) {
        const data: IResponseData<null> = {
          ...this.generateMetadata(req, "An error occurred"),
          status: EStatusCodes.enum.badRequest,
          success: false,
        };
        res.status(EStatusCodes.enum.badRequest).json(data);
        return
      }

      const user = validation.data;
      const result = await this.authUseCase.socialSignIn(user);
      if (!result.success) {
        const data: IResponseData<null> = {
          ...this.generateMetadata(req, result.error),
          status: result.status ?? EStatusCodes.enum.unauthorized,
          success: false,
        };
        res.status(data.status).json(data);
        return
      }

      const data: IResponseData<TUser> = {
        ...this.generateMetadata(req, `${validation.data.oauth.provider} signin successful`),
        status: EStatusCodes.enum.ok,
        success: true,
        data: result.data,
      };
      res.status(data.status).json(data);
    } catch (error) {
      next(error);
    }
  }

  async signOut(req: Request, res: Response, next: NextFunction) {
    try {
      this.clearCookies(res)
        .status(EStatusCodes.enum.ok)
        .json({
          ...this.generateMetadata(req, "Successfully logged out"),
          status: EStatusCodes.enum.ok,
          success: true,
        });
    } catch (error) {
      next(error);
    }
  }

  private getTokenOptions() {
    return {
      accessTokenOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
        domain: "localhost",
        path: "/",
        credentials: true,
      } as CookieOptions,
      refreshTokenOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        domain: "localhost",
        path: "/",
        credentials: true,
      } as CookieOptions,
    };
  }

  private setCookies(
    res: Response,
    accessToken?: string,
    refreshToken?: string
  ) {
    const { accessTokenOptions, refreshTokenOptions } = this.getTokenOptions();
    res.cookie("access_token", accessToken, accessTokenOptions);
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);
    return res;
  }

  private clearCookies(res: Response) {
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    return res;
  }
}

const userRepository = new UserRepositoryImpl(UserModel);
const createUser = new CreateUserUseCase(userRepository);
const authUseCase = new AuthUseCase(userRepository, createUser);

export const authControllers = new AuthControllers(authUseCase);