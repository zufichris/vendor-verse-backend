import { AddressSchema, TAddress } from "../../../data/entity/address";
import { IQueryFilters, IQueryResult } from "../../../shared/entity";
import { EStatusCodes } from "../../../shared/enum";
import { AuthContext, BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { hasPermission, validateData } from "../../../util/functions";
import { logger } from "../../../util/logger";
import { IUserRepository } from "../repository";

export class GetAddressesUseCase implements BaseUseCase<IQueryFilters<TAddress>, IQueryResult<TAddress>, AuthContext> {
    constructor(private readonly userRepository: IUserRepository) { }
    async execute(input?: IQueryFilters<TAddress>, context?: AuthContext): Promise<UseCaseResult<IQueryResult<TAddress>>> {
        try {
            if (!context?.userId)
                return handleUseCaseError({ error: "Unauthorized", title: "Get Address", status: EStatusCodes.enum.unauthorized })

            const isPermitted = hasPermission({
                requestedAction: "view",
                resource: {
                    id: "address",
                    ownerId: undefined
                },
                userId: context.userId,
                userPermissions: context.permissions
            })

            if (!isPermitted) {
                return handleUseCaseError({
                    error: "Forbidden: You do not have permission to view address.",
                    title: "View Address - Authorization",
                    status: EStatusCodes.enum.forbidden,
                });
            }
            const result = await this.userRepository.getAddresses(input)
            if (!result)
                return handleUseCaseError({ error: "Failed To Get Address", title: "Address" })
            return {
                success: true,
                data: result
            }
        } catch (error) {
            logger.error("Failed to get Address", { error })
            return handleUseCaseError({ error: "Failed To Get Address", title: "Address" })
        }
    }
}
export class AddAddressUseCase implements BaseUseCase<Partial<TAddress>, TAddress, AuthContext> {
    constructor(private readonly userRepository: IUserRepository) { }
    async execute(input: Partial<TAddress>, context?: AuthContext): Promise<UseCaseResult<TAddress>> {
        try {
            if (!context)
                return handleUseCaseError({ error: "Unauthorized", title: "Create Address", status: EStatusCodes.enum.unauthorized })
            const validation = validateData<TAddress>(input, AddressSchema)
            if (!validation.success)
                return handleUseCaseError({ error: validation.error, title: "Address Validation", status: EStatusCodes.enum.badRequest })
            const result = await this.userRepository.addAddress(validation.data)
            if (!result)
                return handleUseCaseError({ error: "Error Creating Address", title: "Create Address" })
            return ({
                data: result,
                success: true
            })
        } catch (error) {
            return handleUseCaseError({ title: "Create Address" })
        }
    }
}
export class UpdateAddressUseCase implements BaseUseCase<Partial<TAddress>, TAddress, AuthContext> {
    constructor(private readonly userRepository: IUserRepository) { }
    async execute(input: Partial<TAddress>, context?: AuthContext): Promise<UseCaseResult<TAddress>> {
        try {
            if (!context)
                return handleUseCaseError({ error: "Unauthorized", title: "Create Address", status: EStatusCodes.enum.unauthorized })
            const validation = validateData<TAddress>(input, AddressSchema)
            if (!validation.success)
                return handleUseCaseError({ error: validation.error, title: "Address Validation", status: EStatusCodes.enum.badRequest })
            const result = await this.userRepository.updateAddress(validation.data)
            if (!result)
                return handleUseCaseError({ error: "Error Updating Address", title: "Update Address" })
            return ({
                data: result,
                success: true
            })
        } catch (error) {
            return handleUseCaseError({ title: "Update Address" })
        }
    }
}