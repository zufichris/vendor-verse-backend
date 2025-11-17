import { Schema, model, Document, models } from "mongoose";
import { Coupon } from "./coupon.types";



export type CouponDocument = Document & Omit<Coupon, 'id'>;

const CouponSchema = new Schema<CouponDocument>(
    {
        code: { type: String, required: true, unique: true },
        discountPercent: {
            type: Number,
            required: true,
            validate: {
                validator: function (val) {
                    return val > 0 && val <= 100
                },
                message: "Invalid discount percent. Must be greater than 0 and less than or equal to 100"
            },

        },
        userEmail: { type: String, required: false },
        used: { type: Boolean, default: false },
        maxUses: { type: Number },
        usesCount: { type: Number, default: 0 },
        expiresAt: { type: Date },
        minOrderAmount: { type: Number }
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: {
            virtuals: true,
            transform(_, ret) {
                ret.id = ret._id;
                delete ret._id;
            },
        },
    },
);


export const CouponModel =
    models.CouponModel || model<CouponDocument>("Coupon", CouponSchema);
