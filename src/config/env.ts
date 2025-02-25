import dotenv from "dotenv";
import { logger } from "../util/logger";
import { z } from "zod";
import { validateData } from "../util/functions";

const { error, parsed } = dotenv.config();

const ENVSchema = z.object({
  in_prod: z.boolean().optional(),
  port: z.string().or(z.number()).refine(
    (val) => !isNaN(Number(val)) && Number(val) >= 1024 && Number(val) <= 65535,
    {
      message: "Missing PORT in .env. Required for server.",
    }
  ),
  mongo_uri: z.string().min(1, {
    message: "Missing MONGO_URI in .env. Required for database.",
  }).refine((uri) => uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://"), {
    message: "MONGO_URI must start with 'mongodb://' or 'mongodb+srv://'.",
  }),
  google_callback_url: z.string().url({
    message: "Missing GOOGLE_CALLBACK_URL in .env. Required for Google OAuth.",
  }),
  google_client_id: z.string().min(1, {
    message: "Missing GOOGLE_CLIENT_ID in .env. Required for Google OAuth.",
  }),
  google_client_secret: z.string().min(1, {
    message: "Missing GOOGLE_CLIENT_SECRET in .env. Required for Google OAuth.",
  }),
  jwt_secret: z.string().min(1, {
    message: "Missing JWT_SECRET in .env. Required for authentication.",
  }),
  url: z.string().url({
    message: "Missing URL in .env. Required for base URL.",
  }),
});

export type TENV = z.infer<typeof ENVSchema>;

const in_prod = parsed?.NODE_ENV?.toLowerCase()?.includes("prod") ?? false;
const url = in_prod ? parsed?.URL_PROD ?? "" : parsed?.URL_DEV ?? "";

export const env: TENV = {
  in_prod,
  port: Number(parsed?.PORT),
  mongo_uri: parsed?.MONGO_URI ?? "",
  google_callback_url: parsed?.GOOGLE_CALLBACK_URL ?? "",
  google_client_id: parsed?.GOOGLE_CLIENT_ID ?? "",
  google_client_secret: parsed?.GOOGLE_CLIENT_SECRET ?? "",
  jwt_secret: parsed?.JWT_SECRET ?? "",
  url,
};

if (error) {
  logger.error("Failed to load environment variables from .env file.");
  process.exit(1);
}

const validate = validateData(env, ENVSchema);

if (!validate.success) {
  logger.error(validate.error);
  process.exit(1);
}
