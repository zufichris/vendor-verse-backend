import mongoose, { FilterQuery } from "mongoose";
import { IBaseRepository } from "../../../shared/repository";
import { ID, IQueryFilters, IQueryResult } from "../../../shared/entity";
import { TUser } from "../../../data/entity/user";
import { TAddress } from "../../../data/entity/address";

export interface IUserRepository extends IBaseRepository<TUser, IQueryResult<TUser> & {
    activeCount: number,
    suspendedCount: number
} | null> {
    findByEmail(email: string): Promise<TUser | null>;
    getPasswordHash(id: ID): Promise<string | null>;
    getAddresses(options?: IQueryFilters<TAddress>): Promise<IQueryResult<TAddress> | null>
    addAddress(input: Partial<TAddress>): Promise<TAddress | null>
    updateAddress(input: Partial<TAddress>): Promise<TAddress | null>
}

export abstract class UserRepository implements IUserRepository {
    abstract create(data: TUser): Promise<TUser | null>;
    abstract findById(id: ID): Promise<TUser | null>;
    abstract update(id: ID, data: Partial<TUser>): Promise<TUser | null>;
    abstract delete(id: ID): Promise<boolean>;
    abstract query(options?: IQueryFilters<TUser>): Promise<IQueryResult<TUser> & {
        activeCount: number,
        suspendedCount: number
    } | null>;
    abstract findByEmail(email: string): Promise<TUser | null>
    abstract count(filter?: FilterQuery<TUser> | undefined): Promise<number | null>
    abstract getPasswordHash(id: ID): Promise<string | null>
    abstract findOne(filter?: mongoose.RootFilterQuery<TUser>): Promise<TUser | null>
    abstract getAddresses(options?: IQueryFilters<TAddress>): Promise<IQueryResult<TAddress> | null>
    abstract addAddress(input: Partial<TAddress>): Promise<TAddress | null>
    abstract updateAddress(input: Partial<TAddress>): Promise<TAddress | null>
}