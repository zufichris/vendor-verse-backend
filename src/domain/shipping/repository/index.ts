import { FilterQuery, RootFilterQuery } from "mongoose";
import { TShipping } from "../../../data/entity/shipping";
import { IBaseRepository } from "../../../shared/repository";
import { ID, IQueryFilters, IQueryResult } from "../../../shared/entity";

export interface IShippingRepository extends IBaseRepository<TShipping> { }

export abstract class ShippingRepository implements IShippingRepository {
    abstract create(data: Partial<TShipping>): Promise<TShipping | null>;
    abstract update(id: ID, data: Partial<TShipping>): Promise<TShipping | null>;
    abstract findById(id: ID): Promise<TShipping | null>;
    abstract findOne(filter?: RootFilterQuery<TShipping>): Promise<TShipping | null>;
    abstract query(options?: IQueryFilters<TShipping>): Promise<IQueryResult<TShipping>>;
    abstract count(filter?: FilterQuery<TShipping>): Promise<number | null>;
    abstract delete(id: ID): Promise<boolean>;
}
