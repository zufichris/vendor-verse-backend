import { FilterQuery, RootFilterQuery } from "mongoose";
import { TPayment } from "../../../data/entity/payment";
import { IBaseRepository } from "../../../shared/repository";
import { ID, IQueryFilters, IQueryResult } from "../../../shared/entity";

export interface IPaymentRepository extends IBaseRepository<TPayment> { }

export abstract class PaymentRepository implements IPaymentRepository {
    abstract create(data: Partial<TPayment>): Promise<TPayment | null>;
    abstract update(id: ID, data: Partial<TPayment>): Promise<TPayment | null>;
    abstract findById(id: ID): Promise<TPayment | null>;
    abstract findOne(filter?: RootFilterQuery<TPayment>): Promise<TPayment | null>;
    abstract query(options?: IQueryFilters<TPayment>): Promise<IQueryResult<TPayment>>;
    abstract count(filter?: FilterQuery<TPayment>): Promise<number | null>;
    abstract delete(id: ID): Promise<boolean>;
}
