import { Schema, model, Document, models } from "mongoose";
import { NewsLetter } from "./newsletter.types";

export type NewsletterDocument = Document & Omit<NewsLetter, "id">;

const NewsletterSchema = new Schema<NewsletterDocument>(
    {
        email: {
            type: String,
            lowercase: true,
            unique: true,
            index: true,
            required: true
        },
        firstName: {
            required: false,
            type: String
        },
        lastName: {
            required: false,
            type: String
        },
        isSubscribed: {
            type: Boolean,
            default: true
        }
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

export const NewsletterModel =
    models.Newsletter || model<NewsletterDocument>("Newsletter", NewsletterSchema);
