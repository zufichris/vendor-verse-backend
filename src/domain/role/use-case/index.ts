import { IRoleRepository } from "../repository";
import { CreateRoleUseCase } from "./create-role";
import { GetRoleUseCase } from "./get-role";
import { QueryRolesUseCase } from "./query-roles";
import { UpdateRolePermissionsUseCase } from "./update-role-permissions";
import { DeleteRoleUseCase } from "./delete-role"
import { InitializeRoleUseCase } from "./initialize";
import { GetPermissionsUseCase } from "./get-permissions";

export default class RoleUseCase {
    public readonly create: CreateRoleUseCase;
    public readonly get: GetRoleUseCase;
    public readonly query: QueryRolesUseCase;
    public readonly update: UpdateRolePermissionsUseCase;
    public readonly delete: DeleteRoleUseCase;
    public readonly getPermissions: GetPermissionsUseCase;
    private readonly initialize: InitializeRoleUseCase;

    constructor(private readonly roleRepository: IRoleRepository) {
        this.create = new CreateRoleUseCase(this.roleRepository);
        this.get = new GetRoleUseCase(this.roleRepository);
        this.query = new QueryRolesUseCase(this.roleRepository);
        this.update = new UpdateRolePermissionsUseCase(this.roleRepository);
        this.delete = new DeleteRoleUseCase(this.roleRepository);
        this.initialize = new InitializeRoleUseCase(this.roleRepository)
        this.getPermissions = new GetPermissionsUseCase(this.roleRepository)
    }
    async initializeRoles() {
        const [admin, user, vendor] = await Promise.all([
            await this.initialize.execute("Admin"),
            await this.initialize.execute("User"),
            await this.initialize.execute("Vendor")
        ])

        return admin.success && user.success && vendor.success
    }
}
