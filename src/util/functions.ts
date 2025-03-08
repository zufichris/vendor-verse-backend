import mongoose from "mongoose";
import z from "zod";
import { EPermissionAction, EPermissionResource, TRolePermission } from "../data/entity/role";

/**
 * Converts data to Array
 * @type TData the type of data you want to receive, Default is any.
 * @param data The data to convert.
 */
export function toArray<TData>(data: unknown) {
  return Array.isArray(data)
    ? data.map((item) => item as TData)
    : [data as TData];
}


/**
 * Validates data against a Zod schema
 * @param data - The data to be validated
 * @param zodSchema - The Zod schema to validate against
 * @returns An object indicating validation success, error message, and the validated data
 */
export function validateData<T>(
  data: unknown,
  zodSchema: z.ZodObject<any> | z.ZodEffects<any>
): | { data: T, success: true } | { error: string, success: false } {
  const validation = zodSchema.safeParse(data);

  if (validation.success) {
    return {
      success: true,
      data: validation.data as T,
    };
  } else {
    return {
      success: false,
      error: validation.error.errors
        .map((e) => `\n${e.path.join(".")}: ${e.message}`)
        .join("\n-"),
    };
  }
}





/**
 * Validates a Mongoose document before saving using the provided Zod schema.
 * @param mongooseSchema The Mongoose schema.
 * @param zodSchema The Zod schema for validation.
 * @param name The name of the model (used for custom error handling).
 */
export function validateBeforeSave(
  mongooseSchema: mongoose.Schema,
  zodSchema: z.ZodObject<any> | z.ZodEffects<any>,
  name: string
) {
  mongooseSchema.pre("save", function (this: mongoose.Document, next) {
    const parsed = zodSchema.safeParse(this.toObject());
    if (!parsed.success) {
      const errorMessages = parsed.error.errors.map((e) => `${e.path}: ${e.message}`).join(", ");
      const error = new Error(`Validation failed for ${name}: ${errorMessages}`);
      next(error);
    } else {
      next();
    }
  });
}


/**
 * Generates a unique unit ID with an optional prefix and padding
 * Example: getUnitId(UserModel, "USR", 4) => "USR0001"
 * 
 * @param model - Mongoose model to query
 * @param key - Key in the document to use for ID generation
 * @param prefix - Optional prefix for the ID (default: "")
 * @param padStart - Number of digits to pad the numeric part (default: 4)
 * @returns Promise with the generated unit ID
 */
export async function getUnitId<DocumentType extends mongoose.Document>(
  model: mongoose.Model<DocumentType>,
  key: keyof DocumentType,
  prefix: string = "",
  padStart: number = 4
): Promise<string> {
  try {
    if (!model || !key) {
      throw new Error("Model and key are required parameters");
    }

    if (padStart < 1) {
      throw new Error("padStart must be a positive number");
    }
    const latestDocument = await model
      .findOne({}, { [key]: 1 })
      .sort({ createdAt: -1 })
      .lean() as DocumentType | null

    let latestNumber = 0;

    if (latestDocument && latestDocument[key]) {
      const currentId = latestDocument[key] as string;
      const matches = currentId.match(/\d+$/);
      if (matches) {
        latestNumber = parseInt(matches[0], 10);
      }
      if (latestNumber >= Math.pow(10, padStart) - 1) {
        throw new Error(`ID overflow: Maximum value reached for padding of ${padStart} digits`);
      }
    }
    const newNumber = latestNumber + 1;
    const paddedNumber = newNumber.toString().padStart(padStart, '0');
    return `${prefix}${paddedNumber}`;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate unit ID: ${error.message}`);
    }
    throw new Error('Failed to generate unit ID: Unknown error');
  }
}

export function getQueryMetaData({ page, filterCount, limit, totalCount }: {
  totalCount: number,
  page: number,
  limit: number,
  filterCount: number
}) {
  const skip = (page - 1) * limit
  const totalPages = Math.ceil(filterCount / limit);
  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;
  const previousPage = hasPreviousPage ? page - 1 : undefined;
  const nextPage = hasNextPage ? page + 1 : undefined;
  const firstItemIndex = (page - 1) * skip + 1;
  const lastItemIndex = Math.min(page * skip, totalCount);
  // const sortField = 'createdAt';
  // const sortOrder = "asc";

  return ({
    totalPages,
    hasNextPage,
    hasPreviousPage,
    previousPage,
    nextPage,
    firstItemIndex,
    lastItemIndex,
    // sortField,
    // sortOrder,
    page,
    filterCount,
    limit,
    totalCount
  })
}

/**
 * Checks if user has required permissions to access a resource
 * @param userPermissions - loggedIn User Permissions
 * @param resource - Resource to access
 * @param requestedAction - Action to be performed on the resource
 * @param userId - ID of the logged-in user
 * @returns boolean
 */
export function hasPermission({
  requestedAction,
  resource,
  userId,
  userPermissions
}: {
  userPermissions: TRolePermission[],
  resource: { id: z.infer<typeof EPermissionResource>; ownerId?: string },
  requestedAction: z.infer<typeof EPermissionAction>,
  userId: string
}): boolean {
  const matchPermission = userPermissions.find(
    perm => perm.resource === resource.id || perm.resource === "*"
  );

  if (!matchPermission) {
    return false;
  }

  if (matchPermission.actions.includes("manage"))
    matchPermission.actions = [...matchPermission.actions, "create", "view", "delete", "update"]

  if (matchPermission.resource === "*" && matchPermission.scope === "*") {
    return matchPermission.actions.includes(requestedAction) || matchPermission.actions.includes("*");
  }

  if ((resource.ownerId && matchPermission.scope !== "*") && resource.ownerId !== userId) {
    return false;
  }

  return matchPermission.actions.includes(requestedAction) || matchPermission.actions.includes("*");
}