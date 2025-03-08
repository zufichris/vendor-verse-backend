import mongoose from "mongoose";
import { TUser, TUserPreferences, TUserStats, UserSchema } from "../../../entity/user";
import { OAuthProviders } from "../../../enum/auth";
import { Role } from "../../../enum/user";
import { validateBeforeSave } from "../../../../util/functions";
import { ECurrency, ELanguageCode } from "../../../../shared/enum";

export type UserDocument = TUser & mongoose.Document;

const preferencesMongooseSchema = new mongoose.Schema<TUserPreferences>(
  {
    language: {
      type: String,
      enum: Object.values(ELanguageCode.enum),
      default: ELanguageCode.enum.en,
    },
    currency: {
      type: String,
      enum: Object.values(ECurrency.enum),
      default: ECurrency.enum.USD,
    },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
    },
  },
  {
    _id: false,
    versionKey: false,
  }
);

const userStatsMongooseSchema = new mongoose.Schema<TUserStats>(
  {
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    favoriteVendors: [
      {
        vendorName: { type: String, required: true },
        vendorId: { type: String, required: true },
      },
    ],
    recentlyViewedProducts: [
      {
        productId: { type: String, required: true },
        viewedAt: { type: Date, default: () => new Date() },
      },
    ],
    ordersHistory: [
      {
        orderId: { type: String, required: true },
        totalAmount: { type: Number, required: true },
        orderDate: { type: Date, required: true },
      },
    ],
  },
  {
    _id: false,
    versionKey: false,
  }
);

const userMongoose = new mongoose.Schema<UserDocument>(
  {
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    custId: {
      type: String,
      unique: true,
      required: true
    },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: false },
    password: { type: String, required: false },
    profilePictureUrl: {
      external: { type: Boolean, required: false },
      url: { type: String, required: false },
      placeholderText: { type: String, required: false },
    },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    externalProvider: {
      type: String,
      enum: Object.values(OAuthProviders),
      required: false,
    },
    roles: {
      type: [String],
      enum: Object.values(Role),
      default: [Role.User],
    },
    oauth: {
      provider: {
        type: String,
        enum: Object.values(OAuthProviders),
        required: false,
      },
      oauthId: { type: String, required: false },
    },
    tokenPair: {
      accessToken: { type: String, required: false },
      refreshToken: { type: String, required: false },
    },
    stats: userStatsMongooseSchema,
    preferences: preferencesMongooseSchema
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete ret.password;
        delete ret._id;
        delete ret.__v;
      },
      virtuals: true,
    }
  }
);



validateBeforeSave(userMongoose, UserSchema, "User")
export const UserModel: mongoose.Model<UserDocument> =
  mongoose.models.User || mongoose.model<UserDocument>("User", userMongoose);