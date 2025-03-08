import mongoose from "mongoose";
import { VendorRepository } from "../../../../domain/vendor/repository";
import { ID, IQueryFilters, IQueryResult } from "../../../../shared/entity";
import { logger } from "../../../../util/logger";
import { TVendor } from "../../../entity/vendor";
import { VendorDocument, VendorModel } from "../../model/vendor";
import { getQueryMetaData, getUnitId } from "../../../../util/functions";

export class VendorRepositoryImpl implements VendorRepository {
    constructor(private readonly vendorModel: typeof VendorModel) { }
    async create(data: Partial<TVendor>): Promise<TVendor | null> {
        try {
            const vendId = await getUnitId<VendorDocument>(this.vendorModel, "vendId", "VEND", 4)
            const slug = data.businessName?.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')
            if (!vendId) {
                throw new Error("Error Getting Vendor ID")
            }
            const newVendor = await this.vendorModel.create({ ...data, vendId, slug });
            return newVendor.toJSON() as TVendor;
        } catch (error) {
            logger.error("Error Creating Vendor", { error, data });
            return null;
        }
    }
    async findById(id: ID): Promise<TVendor | null> {
        try {
            const vendor = await this.vendorModel.findById(id);
            return vendor?.toJSON() as TVendor;
        } catch (error) {
            logger.error("Error Finding Vendor", { error, id });
            return null;
        }
    }

    async findOne(filter?: mongoose.RootFilterQuery<TVendor>): Promise<TVendor | null> {
        try {
            const vendor = await this.vendorModel.findOne(filter);
            return vendor?.toJSON() as TVendor;
        } catch (error) {
            logger.error("Error Finding Vendor", { error });
            return null;
        }
    }

    async count(filter?: mongoose.FilterQuery<TVendor>): Promise<number> {
        try {
            return await this.vendorModel.countDocuments(filter);
        } catch (error) {
            logger.error("Error Counting Vendors", { error });
            return 0;
        }
    }

    async update(id: ID, data: Partial<TVendor>): Promise<TVendor | null> {
        try {
            const vendor = await this.vendorModel.findByIdAndUpdate(id, data, { new: true });
            return vendor?.toJSON() as TVendor;
        } catch (error) {
            logger.error("Error Updating Vendor", { error, id });
            return null;
        }
    }

    async delete(id: ID): Promise<boolean> {
        try {
            const result = await this.vendorModel.findByIdAndDelete(id);
            return result !== null;
        } catch (error) {
            logger.error("Error Deleting Vendor", { error, id });
            return false;
        }
    }

    async query(options?: IQueryFilters<TVendor>): Promise<IQueryResult<TVendor>> {
        try {
            const limit = options?.limit ?? 10;
            const page = options?.page ?? 1;
            const skip = (page - 1) * limit;

            const [data, totalCount, filterCount] = await Promise.all([
                this.vendorModel.find(options?.filter ?? {}, options?.projection, {
                    ...options?.queryOptions,
                    limit,
                    skip
                }),
                this.count(),
                this.count(options?.filter)
            ]);

            const vendors = data.map(vendor => vendor.toJSON() as TVendor);
            const metadata = getQueryMetaData({
                totalCount,
                page,
                limit,
                filterCount
            });

            return {
                data: vendors,
                ...metadata
            };
        } catch (error) {
            logger.error("Error Querying Vendors", { error });
            throw error
        }
    }
}