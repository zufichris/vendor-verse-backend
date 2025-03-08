import { TUser } from "../../../data/entity/user";
import { IQueryFilters, IQueryResult } from "../../../shared/entity";
import { EStatusCodes } from "../../../shared/enum";
import { AuthContext, BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { getPermission, hasRequiredPermissions } from "../../../util/functions";
import { IUserRepository } from "../repository";

export class QueryUsersUseCase implements BaseUseCase<IQueryFilters<TUser>, IQueryResult<TUser> & {
  activeCount: number,
  suspendedCount: number,
}, AuthContext> {
  constructor(private readonly userRepository: IUserRepository) { }
  async execute(input: IQueryFilters<TUser>, context?: AuthContext): Promise<UseCaseResult<IQueryResult<TUser> & {
    activeCount: number,
    suspendedCount: number,
  }>> {
    try {
      const limit = input.limit ?? 10
      const page = input.page ?? 1
      input.limit = limit;
      input.page = page
      if (!context?.userId) {
        return handleUseCaseError({ error: "Unauthorized", title: "Query Users", status: EStatusCodes.enum.forbidden })
      }
      const REQUIRED_PERMISSION = getPermission("user", "manage");
      const hasPermission = hasRequiredPermissions(REQUIRED_PERMISSION, context.permissions);
      if (!hasPermission) {
        return handleUseCaseError({
          error: "Forbidden: You do not have permission to view users.",
          title: "View Users - Authorization",
          status: EStatusCodes.enum.forbidden,
        });
      }
      const result = await this.userRepository.query(input)
      if (!result) {
        return handleUseCaseError({ title: "Query Users" })
      }
      return ({
        success: true,
        data: result
      })
    } catch (error) {
      return handleUseCaseError({ title: "Query Users" })
    }
  }
}