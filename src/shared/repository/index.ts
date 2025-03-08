import mongoose from "mongoose";
import { ID, IQueryFilters, IQueryResult } from "../entity";

export interface IBaseRepository<TData, TQueryResult = IQueryResult<TData>> {
  create(data: Partial<TData>): Promise<TData | null>;
  update(id: ID, data: Partial<TData>): Promise<TData | null>;
  delete(id: ID): Promise<boolean>;
  findById(id: ID): Promise<TData | null>;
  findOne(filter?: mongoose.RootFilterQuery<TData>): Promise<TData | null>;
  query(options?: IQueryFilters<TData>): Promise<TQueryResult>;
  count(filter?: mongoose.FilterQuery<TData>): Promise<number | null>;
}
