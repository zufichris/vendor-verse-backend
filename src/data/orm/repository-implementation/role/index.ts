import mongoose from "mongoose";
import { RoleRepository } from "../../../../domain/role/repository";
import { ID, IQueryFilters, IQueryResult } from "../../../../shared/entity";
import { logger } from "../../../../util/logger";
import { TRole, TRolePermission } from "../../../entity/role";
import { RoleDocument } from "../../model/role";
import { getQueryMetaData } from "../../../../util/functions";

export class RoleRepositoryImpl implements RoleRepository {
    constructor(private readonly roleModel: mongoose.Model<RoleDocument>) { }

    async create(data: Partial<TRole>): Promise<TRole | null> {
        try {
            const newRole = await this.roleModel.create(data);
            return newRole.toJSON() as TRole;
        } catch (error) {
            logger.error("Error Creating Role", { error, data });
            return null;
        }
    }

    async findById(id: ID): Promise<TRole | null> {
        try {
            const role = await this.roleModel.findById(id);
            return role?.toJSON() as TRole;
        } catch (error) {
            logger.error("Error Finding Role", { error, id });
            return null;
        }
    }

    async findOne(filter?: mongoose.RootFilterQuery<TRole>): Promise<TRole | null> {
        try {
            const role = await this.roleModel.findOne(filter);
            return role?.toJSON() as TRole;
        } catch (error) {
            logger.error("Error Finding Role", { error });
            return null;
        }
    }

    async count(filter?: mongoose.FilterQuery<TRole>): Promise<number> {
        try {
            return await this.roleModel.countDocuments(filter);
        } catch (error) {
            logger.error("Error Counting Roles", { error });
            return 0;
        }
    }

    async update(id: ID, data: Partial<TRole>): Promise<TRole | null> {
        try {
            const role = await this.roleModel.findByIdAndUpdate(id, data, { new: true });
            return role?.toJSON() as TRole;
        } catch (error) {
            logger.error("Error Updating Role", { error, id });
            return null;
        }
    }

    async delete(id: ID): Promise<boolean> {
        try {
            const result = await this.roleModel.findByIdAndDelete(id);
            return result !== null;
        } catch (error) {
            logger.error("Error Deleting Role", { error, id });
            return false;
        }
    }

    async query(options?: IQueryFilters<TRole>): Promise<IQueryResult<TRole>> {
        try {
            const limit = options?.limit ?? 10;
            const page = options?.page ?? 1;
            const skip = (page - 1) * limit;

            const [data, totalCount, filterCount] = await Promise.all([
                this.roleModel.find(options?.filter ?? {}, options?.projection, {
                    ...options?.queryOptions,
                    limit,
                    skip
                }),
                this.count(),
                this.count(options?.filter)
            ]);

            const roles = data.map(role => role.toJSON() as TRole);
            const metadata = getQueryMetaData({
                totalCount,
                page,
                limit,
                filterCount
            });

            return {
                data: roles,
                ...metadata
            };
        } catch (error) {
            logger.error("Error Querying Roles", { error });
            throw error;
        }
    }

    async findByName(name: string): Promise<TRole | null> {
        try {
            const role = await this.roleModel.findOne({ name });
            return role?.toJSON() as TRole;
        } catch (error) {
            logger.error("Error Finding Role by Name", { error, name });
            return null;
        }
    }

    async getPermissions(name: string): Promise<TRolePermission[] | null> {
        try {
            const role = await this.roleModel.findOne({ name });
            return role?.permissions ?? null;
        } catch (error) {
            logger.error("Error Getting Role Permissions", { error, name });
            return null;
        }
    }
}