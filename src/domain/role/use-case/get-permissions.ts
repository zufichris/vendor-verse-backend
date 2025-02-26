import { BaseUseCase, UseCaseResult, AuthContext } from "../../../global/use-case";
import { TRolePermission } from "../../../data/entity/role";
import { IRoleRepository } from "../repository";
import { logger } from "../../../util/logger";


export class GetPermissionsUseCase implements BaseUseCase<string[], TRolePermission[], AuthContext> {
    constructor(private readonly roleRepository: IRoleRepository) { }

    async execute(roleNames: string[]): Promise<UseCaseResult<TRolePermission[]>> {
        try {
            const result = await this.roleRepository.query({
                filter: {
                    name: { '$in': roleNames }
                },
                projection: {
                    permissions: 1
                },
                queryOptions: {
                    sort: { weight: 1 }
                },
                page: 1,
                limit: 1
            })
            if (!result?.data.length) {
                return { data: [], success: true }
            }

            const permissions = result.data[0].permissions

            return { success: true, data: permissions };
        } catch (error: any) {
            logger.error(error?.message);
            return ({
                data: [],
                success: true
            })
        }
    }
}