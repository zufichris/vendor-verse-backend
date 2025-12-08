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
    stripe_webhook_secret: z.string().describe("stripe webhook secret"),
    imgbb: z.object({
        apiKey: z.string().describe("imgbb api key"),
        baseUrl: z.string().url().default("https://api.imgbb.com/1/upload").describe("imgbb base url"),
    }),
    cwd: z.string(),
    email: z.object({
        sendgridApiKey: z.string().describe("Sendgrid api key is required"),
        mailJet: z.object({
            apiKey: z.string(),
            apiSecret: z.string()
        }),
        defaultSender: z.object({
            email: z.string().email(),
            name: z.string().default('No Reply')
        })
    }),
    quiqup: z.object({
        clientId: z.string(),
        clientSecret: z.string(),
        baseUrl: z.string()
    })
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
    client_url: process.env.CLIENT_URL,
    stripe_apikey: process.env.STRIPE_APIKEY!,
    stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET!,
    imgbb: {
        apiKey: process.env.IMGBB_API_KEY!,
        baseUrl: process.env.IMGBB_BASE_URL! || 'https://api.imgbb.com',
    },
    cwd: process.cwd(),
    email: {
        sendgridApiKey: process.env.SENDGRID_API_KEY!,
        mailJet: {
            apiKey: process.env.MAILJET_API_KEY!,
            apiSecret: process.env.MAILJET_API_SECRET!
        },
        defaultSender: {
            email: process.env.EMAIL_DEFAULT_SENDER!,
            name: process.env.EMAIL_DEFAULT_SENDER_NAME || 'No Repky'
        }
    },
    quiqup: {
        clientId: process.env.QUIQUP_CLIENT_ID!,
        clientSecret: process.env.QUIQUP_CLIENT_SECRET!,
        baseUrl: process.env.QUIQUP_BASE_URL!
    }
};

ENVSchema.parse(env);
