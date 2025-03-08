import { FilterQuery, RootFilterQuery } from "mongoose";
import { ID, IQueryFilters, IQueryResult } from "../../../shared/entity";
import { IBaseRepository } from "../../../shared/repository";
import { TOrder } from "../../../data/entity/order";

export interface IOrderRepository extends IBaseRepository<TOrder> { }

export abstract class OrderRepository implements IOrderRepository {
    abstract create(data: Partial<TOrder>): Promise<TOrder | null>;
    abstract findById(id: ID): Promise<TOrder | null>;
    abstract findOne(filter?: RootFilterQuery<TOrder>): Promise<TOrder | null>;
    abstract update(id: ID, data: Partial<TOrder>): Promise<TOrder | null>;
    abstract query(options?: IQueryFilters<TOrder>): Promise<IQueryResult<TOrder>>;
    abstract count(filter?: FilterQuery<TOrder>): Promise<number | null>;
    abstract delete(id: ID): Promise<boolean>;
}