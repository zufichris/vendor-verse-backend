import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();

const ENVSchema = z.object({
  in_prod: z.boolean().optional(),
  port: z
    .string()
    .or(z.number())
    .refine(
      (val) =>
        !isNaN(Number(val)) && Number(val) >= 1024 && Number(val) <= 65535,
      {
        message: "Missing PORT in .env. Required for server.",
      },
    ),
  mongo_uri: z
    .string()
    .min(1, {
      message: "Missing MONGO_URI in .env. Required for database.",
    })
    .refine(
      (uri) => uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://"),
      {
        message: "MONGO_URI must start with 'mongodb://' or 'mongodb+srv://'.",
      },
    ),
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
  client_url: z.string().url().optional().describe("client url"),
  stripe_apikey: z.string().describe("stripe api key"),
});

export type TENV = z.infer<typeof ENVSchema>;

const in_prod = process.env?.NODE_ENV?.toLowerCase()?.includes("prod") ?? false;
const url = (in_prod ? process.env.URL_PROD : process.env.URL_DEV)!;

export const env: TENV = {
  in_prod,
  port: Number(process.env.PORT)!,
  mongo_uri: process.env.MONGODB_URI!,
  google_callback_url: process.env.GOOGLE_CALLBACK_URL!,
  google_client_id: process.env.GOOGLE_CLIENT_ID!,
  google_client_secret: process.env.GOOGLE_CLIENT_SECRET!,
  jwt_secret: process.env.JWT_SECRET!,
  url,
  client_url:process.env.CLIENT_URL,
  stripe_apikey: process.env.STRIPE_APIKEY!,
};

ENVSchema.parse(env);
