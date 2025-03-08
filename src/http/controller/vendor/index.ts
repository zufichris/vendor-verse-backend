import { Request, Response, NextFunction } from "express";
import { VendorRepositoryImpl } from "../../../data/orm/repository-implementation/vendor";
import { VendorModel } from "../../../data/orm/model/vendor";
import { validateData } from "../../../util/functions";
import { EStatusCodes } from "../../../shared/enum";
import { TVendor } from "../../../data/entity/vendor";
import { IQueryFilters, IResponseData, IResponseDataPaginated } from "../../../shared/entity";
import { CreateVendorDTO, CreateVendorSchema, UpdateVendorDTO, UpdateVendorSchema } from "../../../data/dto/vendor";
import VendorUseCase from "../../../domain/vendor/use-case";

export class VendorControllers {
    constructor(
        private readonly vendorUseCase: VendorUseCase
    ) {
        this.createVendor = this.createVendor.bind(this);
        this.getVendor = this.getVendor.bind(this);
        this.updateVendor = this.updateVendor.bind(this);
        this.queryVendors = this.queryVendors.bind(this);
        this.verifyVendor = this.verifyVendor.bind(this);
        this.deleteVendor = this.deleteVendor.bind(this);
    }

    async createVendor(req: Request, res: Response, next: NextFunction) {
        try {
            const validate = validateData<CreateVendorDTO>(req.body, CreateVendorSchema);
            if (!validate.success) {
                const data = {
                    ...this.generateMetadata(req, "Invalid input data"),
                    status: EStatusCodes.enum.badRequest,
                    success: false,
                    description: validate.error
                }
                res.status(data.status).json(data);
                return;
            }

            const result = await this.vendorUseCase.create.execute(validate.data, req.user!);
            if (!result.success) {
                const data = {
                    ...this.generateMetadata(req, "Failed to create vendor"),
                    status: EStatusCodes.enum.conflict,
                    success: false
                }
                res.status(data.status).json(data);
                return;
            }

            const data: IResponseData<TVendor> = {
                ...this.generateMetadata(req, "Vendor created successfully"),
                status: EStatusCodes.enum.created,
                success: true,
                data: result.data
            }
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    async getVendor(req: Request, res: Response, next: NextFunction) {
        try {
            const vendorId = req.params.vendorId;
            if (!vendorId) {
                const data = {
                    ...this.generateMetadata(req, "Missing vendor ID"),
                    status: EStatusCodes.enum.badRequest,
                    success: false
                }
                res.status(data.status).json(data);
                return;
            }

            const result = await this.vendorUseCase.get.execute({ vendId: vendorId }, req.user);
            if (!result.success) {
                const data = {
                    ...this.generateMetadata(req, "Vendor not found"),
                    status: EStatusCodes.enum.notFound,
                    success: false
                }
                res.status(data.status).json(data);
                return;
            }

            const data: IResponseData<TVendor> = {
                ...this.generateMetadata(req, "Vendor retrieved successfully"),
                status: EStatusCodes.enum.ok,
                success: true,
                data: result.data
            }
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    async queryVendors(req: Request, res: Response, next: NextFunction) {
        try {
            const query = this.generateVendorQuery(req.query)
            const result = await this.vendorUseCase.query.execute(query);
            if (!result.success) {
                const data = {
                    ...this.generateMetadata(req, "Failed to retrieve vendors"),
                    status: EStatusCodes.enum.badGateway,
                    success: false
                }
                res.status(data.status).json(data);
                return;
            }

            const data: IResponseDataPaginated<TVendor> = {
                ...this.generateMetadata(req, "Vendors retrieved successfully"),
                ...result.data,
                status: EStatusCodes.enum.ok,
                success: true,
            }
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    async updateVendor(req: Request, res: Response, next: NextFunction) {
        try {
            const validate = validateData<UpdateVendorDTO>(req.body, UpdateVendorSchema);
            if (!validate.success) {
                const data = {
                    ...this.generateMetadata(req, "Invalid input data"),
                    status: EStatusCodes.enum.badRequest,
                    success: false,
                    details: validate.error
                }
                res.status(data.status).json(data);
                return;
            }

            const result = await this.vendorUseCase.updateProfile.execute({
                data: req.body,
                id: req.body.id
            }, req.user!);
            if (!result.success) {
                const data = {
                    ...this.generateMetadata(req, "Failed to update vendor"),
                    status: EStatusCodes.enum.conflict,
                    success: false
                }
                res.status(data.status).json(data);
                return;
            }

            const data: IResponseData<TVendor> = {
                ...this.generateMetadata(req, "Vendor updated successfully"),
                status: EStatusCodes.enum.ok,
                success: true,
                data: result.data
            }
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    async verifyVendor(req: Request, res: Response, next: NextFunction) {
        try {
            const vendorId = req.params.vendorId;
            const status = req.body.status;
            const reason = req.body.reason;

            const result = await this.vendorUseCase.verify.execute({ id: vendorId, status, reason });
            if (!result.success) {
                const data = {
                    ...this.generateMetadata(req, "Failed to change vendor status"),
                    status: result.status ?? EStatusCodes.enum.badGateway,
                    success: false
                }
                res.status(data.status).json(data);
                return;
            }

            const data: IResponseData<TVendor> = {
                ...this.generateMetadata(req, "Vendor status updated successfully"),
                status: EStatusCodes.enum.ok,
                success: true,
                data: result.data
            }
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    async deleteVendor(req: Request, res: Response, next: NextFunction) {
        try {
            const vendorId = req.params.vendorId;
            const result = await this.vendorUseCase.delete.execute(vendorId, req.user!)

            if (!result.success) {
                const data = {
                    ...this.generateMetadata(req, "Failed to delete vendor"),
                    status: EStatusCodes.enum.conflict,
                    success: false
                }
                res.status(data.status).json(data);
                return;
            }

            const data = {
                ...this.generateMetadata(req, "Vendor deleted successfully"),
                status: EStatusCodes.enum.ok,
                success: true
            }
            res.status(data.status).json(data);
        } catch (error) {
            next(error);
        }
    }

    private generateMetadata(req: Request, message: string, type?: string) {
        return ({
            url: req.url,
            path: req.path,
            type: type ?? "Vendor",
            message,
            error: {
                message
            }
        })
    }
    private generateVendorQuery(query: qs.ParsedQs) {
        let {
            page = 1,
            limit = 10,
            sort_order = "asc",
            sort_by = "businessName"
        } =
            query;
        if (sort_by === 'name') {
            sort_by = 'businessName'
        }
        const sortByStr = String(sort_by);
        const sortOrderStr = String(sort_order);
        const sort = { [sortByStr]: sortOrderStr === 'desc' ? -1 : 1 }
        const searchTerm = typeof query.search === 'string' ? query.search : '';
        const search = searchTerm ? {
            $or: [
                { businessName: { $regex: searchTerm, $options: 'i' } },
            ]
        } : undefined;
        const filter = search ?? {
            isVerified: !query.show_unverified ? true : { "$in": [true, false] },
        }

        const queryOptions = {
            sort
        }
        const projection = {
            businessName: true,
            businessType: true,
            description: true,
            isVerified: true,
            userId: true,
            id: true,
            storefront: true,
            vendId: true,
            lastActiveAt: true,
            createdAt: true,
            updatedAt: true
        }
        const options: IQueryFilters<TVendor> = {
            filter,
            limit: Number(limit ?? 10),
            page: Number(page ?? 1),
            projection,
            queryOptions
        }
        return options
    }
}


export const vendorControllers = new VendorControllers(new VendorUseCase(new VendorRepositoryImpl(VendorModel)));
