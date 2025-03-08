import { FilterQuery, RootFilterQuery } from "mongoose";
import { TPaymentMethod } from "../../../data/entity/payment-method";
import { IBaseRepository } from "../../../shared/repository";
import { ID, IQueryFilters, IQueryResult } from "../../../shared/entity";

export interface IPaymentMethodRepository extends IBaseRepository<TPaymentMethod> { }

export abstract class PaymentMethodRepository implements IPaymentMethodRepository {
    abstract create(data: Partial<TPaymentMethod>): Promise<TPaymentMethod | null>;
    abstract update(id: ID, data: Partial<TPaymentMethod>): Promise<TPaymentMethod | null>;
    abstract findById(id: ID): Promise<TPaymentMethod | null>;
    abstract findOne(filter?: RootFilterQuery<TPaymentMethod>): Promise<TPaymentMethod | null>;
    abstract query(options?: IQueryFilters<TPaymentMethod>): Promise<IQueryResult<TPaymentMethod>>;
    abstract count(filter?: FilterQuery<TPaymentMethod>): Promise<number | null>;
    abstract delete(id: ID): Promise<boolean>;
}
