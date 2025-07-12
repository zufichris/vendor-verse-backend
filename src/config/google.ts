import { z } from "zod";
import { env } from ".";
export const GoogleAuthSchema = z.object({
  clientId: z.string({
    message: "Invalid Google client_id",
  }),
  clientSecret: z.string({
    message: "Invalid Google client_secret",
  }),
  redirectUri: z.string({
    message: "Invalid Google redirect_uri",
  }),
  accessType: z
    .string({
      message: "Invalid Google client_id",
    })
    .optional()
    .default("offline"),
  responseType: z
    .string({
      message: "Invalid Google response_type",
    })
    .optional()
    .default("code"),
  prompt: z
    .string({
      message: "Invalid Google prompt",
    })
    .optional()
    .default("consent"),
  scope: z.array(z.string(), {
    message: "Invalid Google scope",
  }),
  codeAccessUrl: z.string({
    message: "Invalid Google code_access_url",
  }),
  tokenAccessUrl: z.string({
    message: "Invalid Google token_access_url",
  }),
  profileAccessUrl: z
    .string({
      message: "Invalid Google profile_access_url",
    })
    .optional(),
  grantType: z
    .string({
      message: "Invalid Google grant_type",
    })
    .optional()
    .default("authorization_code"),
});
export type TGoogleAuthConfig = z.infer<typeof GoogleAuthSchema>;

export const GoogleAuthConfig = {
  clientId: env.google_client_id,
  clientSecret: env.google_client_secret,
  redirectUri: env.google_callback_url,
  accessType: "offline",
  responseType: "code",
  prompt: "consent",
  scope: [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
  ],
  codeAccessUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenAccessUrl: "https://oauth2.googleapis.com/token",
  profileAccessUrl: "https://www.googleapis.com/oauth2/v1/userinfo",
  grantType: "authorization_code",
} as TGoogleAuthConfig;
