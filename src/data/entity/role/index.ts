import { z } from "zod";

export const EPermissionResource = z.enum([
    "role",
    "product",
    "user",
    "order",
    "vendor",
    "payment",
    "payment-method",
    "address",
    "shipping",
    "*"
]);
export const EPermissionAction = z.enum([
    "manage",
    "update",
    "delete",
    "view",
    "create",
    "*"
]);

export const EPermissionScope = z.enum([
    "own",
    "*"
]);



export const RolePermission = z.object({
    resource: EPermissionResource,
    actions: z.array(EPermissionAction),
    scope: EPermissionScope
})

export const defaultPermissions: z.infer<typeof RolePermission>[] = [
    { resource: "product", actions: ["view"], scope: "*" },
    { resource: "user", actions: ["manage"], scope: "own" },
    { resource: "order", actions: ["manage"], scope: "own" },
    { resource: "vendor", actions: ["view"], scope: "*" },
    { resource: "payment", actions: ["manage"], scope: "*" },
    { resource: "payment-method", actions: ["view"], scope: "*" },
    { resource: "address", actions: ["manage"], scope: "own" },
    { resource: "shipping", actions: ["manage"], scope: "own" },
];


export const RoleSchema = z.object({
    id: z.string().optional(),
    weight: z.number().optional().default(1),
    name: z.string().min(2, "Role name must have at least 2 characters"),
    permissions: z
        .array(RolePermission)
        .default(defaultPermissions),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional()
});

export type TRolePermission = z.infer<typeof RolePermission>;
export type TRole = z.infer<typeof RoleSchema>;