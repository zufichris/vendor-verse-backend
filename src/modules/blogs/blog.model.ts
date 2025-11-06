import { Document, models, Schema, model } from "mongoose";
import { Blog } from "./blog.types";
import { slugify } from "../../core/utils/slugify.util";

type BlogDocument = Document & Omit<Blog, 'id' | 'createdAt' | 'updatedAt'>;

export const BlogSchema = new Schema<BlogDocument>({
    title: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 150,
        match: /^[a-zA-Z0-9\s\-\.]+$/,
        unique: true,
        index: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    mainImageUrl: {
        type: String,
        required: false
    },
    htmlContent: {
        type: String,
        required: true
    },
    jsonContent: {
        type: Schema.Types.Mixed,
        required: false
    },
    summary: {
        type: String,
        maxlength: 300,
        required: false
    },
    tags: {
        type: [String],
        required: false
    },
    author: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 100,
        ref: 'User'
    }
}, {
    timestamps: true,
    versionKey: false,
    toJSON: {
        transform: (doc, ret: Record<string, any>) => {
            ret.id = doc._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

// generate slug before saving
BlogSchema.pre<BlogDocument>('validate', function (next) {
    if (this.isModified('title') || this.isNew) {
        this.slug = slugify(this.title);
    }

    if (this.jsonContent && typeof this.jsonContent !== 'string') {
        this.jsonContent = JSON.stringify(this.jsonContent);
    }
    next();
});


export const BlogModel = models.Blog || model<BlogDocument>('Blog', BlogSchema);