import QueryString from "qs";
import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../shared/error";
import { OAuthProviders } from "../../../data/enum/auth";
import { GoogleAuthSchema, TGoogleAuthConfig } from "../../../config/google";
import { validateData } from "../../../util/functions";
import { EStatusCodes } from "../../../shared/enum";
import { env } from "../../../config/env";
import { IResponseData } from "../../../shared/entity";
import { SocialSignInDTO } from "../../../data/dto/auth";

interface GoogleProfile {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean
}

interface GoogleTokens {
  access_token: string;
  token_type: string;
  id_token: string;
  expires_in: number,
  refresh_token: string
}

export class GoogleAuthControllers {
  private readonly config: Readonly<TGoogleAuthConfig>;

  constructor(googleAuthConfig: TGoogleAuthConfig) {
    const validation = validateData(googleAuthConfig, GoogleAuthSchema);
    if (!validation.success) {
      throw new AppError({
        message: "Invalid Google auth configuration.",
        statusCode: EStatusCodes.enum.badRequest,
        details: validation.error
      });
    }
    this.config = Object.freeze({ ...googleAuthConfig });
    this.authRequest = this.authRequest.bind(this);
    this.getGoogleTokens = this.getGoogleTokens.bind(this);
    this.getUserProfile = this.getUserProfile.bind(this);
  }

  private createAuthOptions(): string {
    return QueryString.stringify({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      access_type: this.config.accessType,
      response_type: this.config.responseType,
      prompt: this.config.prompt,
      scope: this.config.scope.join(" "),
    });
  }

  private async fetchWithErrorHandling<T>(
    url: string,
    errorMessage: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new AppError({
          message: errorMessage,
          type: "Auth Error",
          statusCode: EStatusCodes.enum.badRequest,
          details: `Request failed with status: ${response.status}`,
        });
      }
      const data = await response.json();
      return data
    } catch (error: any) {
      throw new AppError({
        message: errorMessage,
        type: "Auth Error",
        statusCode: EStatusCodes.enum.internalServerError,
        details: error.message,
      });
    }
  }

  async authRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const options = this.createAuthOptions();
      const authUrl = `${this.config.codeAccessUrl}?${options}`;
      const callback = req.query.callback

      if (callback) {
        const validCallBack = env.google_callback_url.includes(callback as string)
        if (!validCallBack) {
          res.status(EStatusCodes.enum.badRequest).json({
            status: EStatusCodes.enum.badRequest,
            success: false,
            message: "Invalid callback URL provided."
          } as IResponseData<null>)
        }
        res.status(EStatusCodes.enum.ok).json({
          success: true,
          message: "Google auth URL generated successfully.",
          status: EStatusCodes.enum.ok,
          type: "Google Auth Request",
          redirect: {
            path: authUrl
          }
        } as IResponseData<null>)
      } else {
        res.redirect(authUrl);
      }

    } catch (error: any) {
      next(new AppError({
        message: "Failed to create Google Auth request URL.",
        type: "Auth Error",
        details: error.message,
        statusCode: EStatusCodes.enum.internalServerError
      }));
    }
  }

  async getGoogleTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const code = req.query.code as string | undefined;
      if (!code) {
        throw new AppError({
          message: "Authorization code is missing.",
          type: "Auth Error",
          statusCode: EStatusCodes.enum.badRequest
        });
      }
      const query = QueryString.stringify({
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        grant_type: this.config.grantType,
      });

      const url = `${this.config.tokenAccessUrl}?${query}`;
      const tokens = await this.fetchWithErrorHandling<GoogleTokens>(
        url,
        "Failed to obtain Google tokens.",
        { method: "POST" },
      );
      req.body = tokens;
      next();
    } catch (error) {
      next(error);
    }
  }

  async getUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tokens = req.body as Partial<GoogleTokens>;
      const { access_token, token_type, id_token } = tokens;

      if (!access_token || !token_type || !id_token) {
        throw new AppError({
          message: "Incomplete token information received.",
          type: "Auth Error",
          statusCode: EStatusCodes.enum.badRequest
        });
      }

      const url = `${this.config.profileAccessUrl}?alt=json&access_token=${access_token}`;
      const profile = await this.fetchWithErrorHandling<GoogleProfile>(
        url,
        "Failed to fetch Google user profile.",
        {
          headers: {
            Authorization: `${token_type} ${id_token}`,
          },
        }
      );

      const userData: SocialSignInDTO = {
        firstName: profile.name,
        email: profile.email,
        isEmailVerified: profile.verified_email,
        profilePictureUrl: {
          external: true,
          url: profile.picture,
        },
        oauth: {
          oauthId: profile.id,
          provider: OAuthProviders.Google,
        },
      };
      req.body = userData;
      next();
    } catch (error) {
      next(error);
    }
  }
}