import mongoose from "mongoose";
import { defaultPermissions, EPermissionAction, EPermissionResource, EPermissionScope, RoleSchema, TRole, TRolePermission } from "../../../entity/role";
import { validateBeforeSave } from "../../../../util/functions";

export type RoleDocument = TRole & mongoose.Document

const PermissionSchema = new mongoose.Schema<TRolePermission & mongoose.Document>({
    resource: {
        type: String,
        enum: EPermissionResource.Enum,
    },
    actions: [
        {
            type: String,
            enum: EPermissionAction.Enum
        }
    ],
    scope: {
        type: String,
        enum: EPermissionScope.Enum
    }
}, {
    _id: false,
    versionKey: false
})

const schema = new mongoose.Schema<RoleDocument>({
    name: {
        type: String,
        required: true,
        unique: true
    },
    weight: {
        type: Number,
        default: 1
    },
    permissions: [{
        type: PermissionSchema,
        default: defaultPermissions
    }
    ]
}, {
    timestamps: true,
    toJSON: {
        transform: (doc) => {
            delete doc?._id
            return doc
        },
        versionKey: false
    }
})

validateBeforeSave(schema, RoleSchema, "Role")

export const RoleModel: mongoose.Model<RoleDocument> = mongoose.models.Role || mongoose.model("Role", schema)