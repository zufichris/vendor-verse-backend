import mongoose from "mongoose";
import { TVendor } from "../../../data/entity/vendor";
import { ID, IQueryFilters, IQueryResult } from "../../../shared/entity";
import { IBaseRepository } from "../../../shared/repository";

export interface IVendorRepository extends IBaseRepository<TVendor, IQueryResult<TVendor>> {

}

export abstract class VendorRepository implements IVendorRepository {
    abstract create(data: Partial<TVendor>): Promise<TVendor | null>;
    abstract update(id: ID, data: Partial<TVendor>): Promise<TVendor | null>;
    abstract findById(id: ID): Promise<TVendor | null>;
    abstract findOne(filer: mongoose.RootFilterQuery<TVendor>): Promise<TVendor | null>
    abstract query(options?: IQueryFilters<TVendor>): Promise<IQueryResult<TVendor>>;
    abstract count(filter?: mongoose.FilterQuery<TVendor>): Promise<number | null>
    abstract delete(id: ID): Promise<boolean>
}

