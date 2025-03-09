import QueryString from "qs";
import { NextFunction, Request, Response } from "express";
import { OAuthProviders } from "../../../data/enum/auth";
import { GoogleAuthSchema, TGoogleAuthConfig } from "../../../config/google";
import { validateData } from "../../../util/functions";
import { EStatusCodes } from "../../../shared/enum";
import { env } from "../../../config/env";
import { IResponseData } from "../../../shared/entity";
import { SocialSignInDTO } from "../../../data/dto/auth";
import { throwError } from "../../../shared/error"
import { logger } from "../../../util/logger";

interface GoogleProfile {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}

interface GoogleTokens {
  access_token: string;
  token_type: string;
  id_token: string;
  expires_in: number;
  refresh_token: string;
}

export class GoogleAuthControllers {
  private readonly config: Readonly<TGoogleAuthConfig>;

  constructor(googleAuthConfig: TGoogleAuthConfig) {
    const validation = validateData(googleAuthConfig, GoogleAuthSchema);
    if (!validation.success) {
      throwError({
        message: "Invalid Google auth configuration.",
        statusCode: EStatusCodes.enum.badRequest,
        description: validation.error,
        type: "Validation",
      });
    }
    this.config = Object.freeze({ ...googleAuthConfig });
    this.authRequest = this.authRequest.bind(this);
    this.getGoogleTokens = this.getGoogleTokens.bind(this);
    this.getUserProfile = this.getUserProfile.bind(this);
  }

  private generateMetadata(req: Request, message: string, type?: string) {
    return {
      url: req.url,
      path: req.path,
      type: type ?? "Google Auth",
      message,
    };
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
  ): Promise<T | undefined> {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throwError({
          message: errorMessage,
          type: "Auth Error",
          statusCode: EStatusCodes.enum.badRequest,
          description: `Request failed with status: ${response.status}`,
        });
      }
      const data = await response.json();
      return data as T
    } catch (error: any) {
      throw throwError({
        message: errorMessage,
        type: "Auth Error",
        statusCode: EStatusCodes.enum.internalServerError,
        description: error.message,
      });
    }
  }

  async authRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const options = this.createAuthOptions();
      const authUrl = `${this.config.codeAccessUrl}?${options}`;
      const callback = req.query.callback as string | undefined;

      if (callback) {
        const validCallBack = env.google_callback_url.includes(callback);
        if (!validCallBack) {
          throwError({
            message: "Invalid callback URL provided.",
            statusCode: EStatusCodes.enum.badRequest,
            type: "Validation",
          });
        }
        const data: IResponseData<{ redirect: { path: string } }> = {
          ...this.generateMetadata(req, "Google auth URL generated successfully.", "Google Auth Request"),
          success: true,
          status: EStatusCodes.enum.ok,
          data: { redirect: { path: authUrl } },
        };
        res.status(data.status).json(data);
      } else {
        res.redirect(authUrl);
      }
    } catch (error) {
      logger.error("Error in authRequest:", error);
      next(error);
    }
  }

  async getGoogleTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const code = req.query.code as string | undefined;
      if (!code) {
        throwError({
          message: "Authorization code is missing.",
          description: "Google Authorization code is missing or Invalid.",
          statusCode: EStatusCodes.enum.badRequest,
          type: "Auth Error",
        });
        return
      }
      const googleCodeRegex = /^4\/[A-Za-z0-9-_]+$/;
      if (!googleCodeRegex.test(code)) {
        throwError({
          message: "Invalid authorization code format.",
          description: "The provided Google authorization code is not in the correct format.",
          statusCode: EStatusCodes.enum.badRequest,
          type: "Auth Error",
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
        { method: "POST" }
      );
      req.body = tokens;
      next();
    } catch (error) {
      logger.error("Error in getGoogleTokens:", error);
      next(error);
    }
  }

  async getUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tokens = req.body as Partial<GoogleTokens>;
      const { access_token, token_type, id_token } = tokens;

      if (!access_token || !token_type || !id_token) {
        throwError({
          message: "Incomplete token information received.",
          statusCode: EStatusCodes.enum.badRequest,
          type: "Auth Error",
        });
        return
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

      if (!profile) {
        throwError({
          message: "Failed to fetch Google user profile.",
          description: "Failed to fetch Google user profile.",
          statusCode: EStatusCodes.enum.internalServerError,
          type: "Auth"
        })
        return
      }

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
      logger.error("Error in getUserProfile:", error);
      next(error);
    }
  }
}