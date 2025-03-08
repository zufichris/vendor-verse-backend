import { z } from "zod";
import { OAuthProviders } from "../../enum/auth";
import { Role } from "../../enum/user";
import { ECurrency, ELanguageCode } from "../../../shared/enum";

export const OAuthSchema = z.object({
    provider: z.nativeEnum(OAuthProviders),
    oauthId: z.string(),
})
const PreferencesSchema = z.object({
    language: z.nativeEnum(ELanguageCode.Enum).default(ELanguageCode.enum.en),
    currency: z.nativeEnum(ECurrency.Enum).default(ECurrency.enum.USD),
    notificationPreferences: z.object({
        email: z.boolean().default(true),
        sms: z.boolean().default(false),
        push: z.boolean().default(true),
    }),
});

export const UserStatsSchema = z.object({
    totalOrders: z.number().default(0),
    totalSpent: z.number().default(0),
    averageOrderValue: z.number().default(0),
    favoriteVendors: z.array(
        z.object({
            vendorName: z.string(),
            vendorId: z.string(),
        })
    ).default([]),
    recentlyViewedProducts: z.array(
        z.object({
            productId: z.string(),
            viewedAt: z.date().default(new Date()),
        })
    ).default([]),
    ordersHistory: z.array(
        z.object({
            orderId: z.string(),
            totalAmount: z.number(),
            orderDate: z.date(),
        })
    ).default([]),
});

export const UserSchema = z.object({
    id: z.string().optional(),
    custId: z.string().optional(),
    email: z.string().email(),
    password: z.string().nullable().optional(),
    isEmailVerified: z.boolean().optional().default(false),
    createdAt: z.date().nullable().optional(),
    updatedAt: z.date().nullable().optional(),
    oauth: OAuthSchema.nullable().optional(),
    tokenPair: z.object({
        provider: z.nativeEnum(OAuthProviders).nullable().optional(),
        accessToken: z.string().nullable().optional(),
        refreshToken: z.string().nullable().optional()
    }).nullable().optional(),
    externalProvider: z.nativeEnum(OAuthProviders).nullable().optional(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    phoneNumber: z.string().nullable().optional(),
    profilePictureUrl: z.object({
        external: z.boolean(),
        url: z.string().optional(),
        placeholderText: z.string().optional()
    }).nullable().optional(),
    roles: z.array(z.nativeEnum(Role)).default([Role.User]),
    isActive: z.boolean().optional().default(true),
    preferences: PreferencesSchema.optional().default({
        language: ELanguageCode.enum.en,
        currency: ECurrency.enum.USD,
        notificationPreferences: {
            email: true,
            sms: false,
            push: true,
        },
    }),
    stats: UserStatsSchema.optional().default({
        averageOrderValue: 0,
        favoriteVendors: [],
        ordersHistory: [],
        recentlyViewedProducts: [],
        totalOrders: 0,
        totalSpent: 0
    })
});


export type TUser = z.infer<typeof UserSchema>;
export type TUserStats = z.infer<typeof UserStatsSchema>;
export type TUserPreferences = z.infer<typeof PreferencesSchema>