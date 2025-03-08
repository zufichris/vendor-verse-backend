import { CreateRoleDTO, CreateRoleSchema } from "../../../data/dto/role";
import { defaultPermissions, TRole } from "../../../data/entity/role";
import { BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { IRoleRepository } from "../repository";
import { validateData } from "../../../util/functions";
import { EStatusCodes } from "../../../shared/enum";
import { logger } from "../../../util/logger";

type DefaultRoles = "User" | "Vendor" | "Admin"

export class InitializeRoleUseCase implements BaseUseCase<DefaultRoles, TRole> {
    constructor(private readonly roleRepository: IRoleRepository) { }

    async execute(input: DefaultRoles): Promise<UseCaseResult<TRole>> {
        try {

            const defaultRoles: Record<DefaultRoles, CreateRoleDTO> = {
                Admin: {
                    name: "Admin",
                    weight: 7,
                    permissions: [
                        {
                            resource: "*",
                            actions: ["*"],
                            scope: "*"
                        }
                    ]
                },
                User: {
                    name: "User",
                    weight: 1,
                    permissions: defaultPermissions
                },
                Vendor: {
                    name: "Vendor",
                    weight: 5,
                    permissions: [
                        { resource: "product", actions: ["manage"], scope: "own" },
                        ...defaultPermissions.filter(perm => perm.resource !== "product")
                    ]

                }
            }

            const validationResult = validateData<CreateRoleDTO>(defaultRoles[input], CreateRoleSchema);
            if (!validationResult.success) {
                return handleUseCaseError({
                    error: validationResult.error,
                    title: `Initialize ${input} Role - Validation`,
                    status: EStatusCodes.enum.badRequest,
                });
            }
            const exists = await this.roleRepository.findByName(input)

            if (exists)
                return ({ data: exists, success: true })

            const createdRole = await this.roleRepository.create(validationResult.data);

            if (!createdRole) {
                return handleUseCaseError({
                    error: "Failed to create role in the database.",
                    title: `Initialize ${input} Role- Database Error`,
                    status: EStatusCodes.enum.internalServerError,
                });
            }

            return { success: true, data: createdRole };
        } catch (error: any) {
            logger.error(error?.message);
            return handleUseCaseError({
                error: "An unexpected error occurred during role creation.",
                title: `Initialize ${input} Role - Unexpected Error`,
                status: EStatusCodes.enum.internalServerError,
            });
        }
    }
}
