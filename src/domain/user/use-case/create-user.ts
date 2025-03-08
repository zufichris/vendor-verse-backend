import { CreateUserDTO, CreateUserSchema } from "../../../data/dto/user";
import { TUser } from "../../../data/entity/user";
import { BaseUseCase, handleUseCaseError, UseCaseResult } from "../../../shared/use-case";
import { IUserRepository } from "../repository";
import { validateData } from "../../../util/functions";
import { EStatusCodes } from "../../../shared/enum";
import { Role } from "../../../data/enum/user";
import bcrypt from "bcrypt"
import { logger } from "../../../util/logger";

export class CreateUserUseCase implements BaseUseCase<CreateUserDTO, TUser> {
  constructor(private readonly userRepository: IUserRepository) { }
  async execute(input: any, context?: void | undefined): Promise<UseCaseResult<TUser>> {
    try {
      const validate = validateData<CreateUserDTO>(input, CreateUserSchema.refine((data) => {
        if (!data.oauth && !data.password)
          return false
        return true
      }, {
        message: "Password is required",
        path: ['password']
      }))
      if (!validate.success)
        return handleUseCaseError({ error: validate.error, title: "Create User - Validation", status: EStatusCodes.enum.badRequest })
      const exists = await this.userRepository.findByEmail(validate.data.email)
      if (exists) {
        return handleUseCaseError({ error: "A user with this email address already exists.", title: "Create User - Duplicate Email", status: EStatusCodes.enum.conflict })
      }
      if (validate.data.password) {
        const hash = await this.hashPassword(validate.data.password)
        if (!hash)
          throw Error("hash password operation failed")
        validate.data.password = hash
      }
      const data = {
        ...validate.data,
        isActive: true,
        isEmailVerified: validate.data.isEmailVerified || false,
        firstName: validate.data.firstName ?? validate.data?.email.split("@")[0],
        roles: [Role.User],
        oauth: validate.data.oauth || null,
      }

      const placeholderText = await this.generatePlaceholderText(data.firstName, data.lastName!)
      data.profilePictureUrl = {
        url: data.profilePictureUrl?.url,
        external: data.profilePictureUrl?.external ?? false,
        placeholderText
      }

      const created = await this.userRepository.create(data)
      if (!created) {
        return handleUseCaseError({ error: "Failed to create user in the database.", title: "Create User - Database Error", status: EStatusCodes.enum.internalServerError })
      }
      created.password = undefined
      return ({
        data: created,
        success: true
      })
    } catch (error: any) {
      logger.error(error?.message)
      return handleUseCaseError({ error: "An unexpected error occurred during user creation.", title: "Create User - Unexpected Error", status: EStatusCodes.enum.internalServerError })
    }
  }

  private async generatePlaceholderText(firstName: string, lastName?: string) {
    if (lastName?.length) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`
    }
    if (firstName.split(" ")[1]) {
      return `${firstName.charAt(0)}${firstName.split(" ")[1].charAt(0)}`
    }
    return `${firstName.charAt(0)}${firstName.charAt(firstName.length - 1)}`
  }

  private async hashPassword(password: string): Promise<string | null> {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);
      return hashed;
    } catch (err) {
      logger.error("Error Hashing Password", err);
      throw new Error("Error hashing password");
    }
  }
}