import mongoose from "mongoose";
import { ID, IQueryFilters, IQueryResult } from "../../../shared/entity";
import { TRole, TRolePermission } from "../../../data/entity/role";
import { IBaseRepository } from "../../../shared/repository";


export interface IRoleRepository extends IBaseRepository<TRole> {
    findByName(name: string): Promise<TRole | null>
    getPermissions(name: string): Promise<TRolePermission[] | null>
}

export abstract class RoleRepository implements IRoleRepository {
    abstract create(data: Partial<TRole>): Promise<TRole | null>;
    abstract findById(id: ID): Promise<TRole | null>;
    abstract update(id: ID, data: Partial<TRole>): Promise<TRole | null>;
    abstract findOne(filter?: mongoose.RootFilterQuery<TRole>): Promise<TRole | null>;
    abstract delete(id: ID): Promise<boolean>;
    abstract count(filter?: mongoose.FilterQuery<TRole>): Promise<number | null>;
    abstract query(options?: IQueryFilters<TRole>): Promise<IQueryResult<TRole>>;
    abstract findByName(name: string): Promise<TRole | null>
    abstract getPermissions(name: string): Promise<TRolePermission[] | null>
}