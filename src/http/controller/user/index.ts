import { Request, Response, NextFunction } from "express";
import { validateData } from "../../../util/functions";
import { CreateUserDTO, CreateUserSchema, UpdateUserDTO, UpdateUserSchema } from "../../../data/dto/user";
import { EStatusCodes } from "../../../shared/enum";
import { IQueryFilters, IResponseData, IResponseDataPaginated } from "../../../shared/entity";
import { TUser } from "../../../data/entity/user";
import { UserRepositoryImpl } from "../../../data/orm/repository-implementation/user";
import { UserModel } from "../../../data/orm/model/user";
import { AddressModel } from "../../../data/orm/model/address";
import { AddressSchema, TAddress } from "../../../data/entity/address";
import UserUseCase from "../../../domain/user/use-case";
import qs from 'qs';
import { throwError } from "../../../shared/error";
import { logger } from "../../../util/logger";

export class UserControllers {
  constructor(
    private readonly userUseCase: UserUseCase,
  ) {
    this.getMe = this.getMe.bind(this);
    this.createUser = this.createUser.bind(this);
    this.queryUsers = this.queryUsers.bind(this);
    this.getUser = this.getUser.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.changeUserStatus = this.changeUserStatus.bind(this);
    this.changeUserRole = this.changeUserRole.bind(this);
    this.getAddresses = this.getAddresses.bind(this);
    this.updateAddress = this.updateAddress.bind(this);
    this.addAddress = this.addAddress.bind(this);
    this.getMeAddress = this.getMeAddress.bind(this);
    this.addMeAddress = this.addMeAddress.bind(this);
    this.updateMeAddress = this.updateMeAddress.bind(this);
    this.getUserStats = this.getUserStats.bind(this);
    this.getMeStats = this.getMeStats.bind(this);
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) {
        throwError({
          message: "Authentication required",
          description: "No user found in request",
          statusCode: EStatusCodes.enum.unauthorized,
          type: "Auth"
        });
        return;
      }

      const data: IResponseData<Omit<TUser, "stats"> & { accessToken?: string }> = {
        ...this.generateMetadata(req, "User profile retrieved successfully"),
        data: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email!,
          accessToken: user.tokenPair?.accessToken!,
          preferences: user.preferences!,
          isActive: user.isActive || false,
          isEmailVerified: user.isEmailVerified || false,
          roles: user.roles || [],
          profilePictureUrl: user.profilePictureUrl,
          custId: user.custId,
          phoneNumber: user.phoneNumber
        },
        status: EStatusCodes.enum.ok,
        success: true
      };
      res.status(data.status).json(data);
    } catch (error) {
      logger.error(`Error in getMe:`, error);
      next(error);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const validate = validateData<CreateUserDTO>(req.body, CreateUserSchema);
      if (!validate.success) {
        throwError({
          message: "Validation failed",
          description: validate.error,
          statusCode: EStatusCodes.enum.badRequest,
          type: "Validation"
        });
        return;
      }

      const result = await this.userUseCase.create.execute(validate.data);
      if (!result.success) {
        throwError({
          message: "User creation failed",
          description: result.error,
          statusCode: EStatusCodes.enum.internalServerError,
          type: "Server"
        });
        return;
      }

      const data: IResponseData<TUser> = {
        ...this.generateMetadata(req, "User created successfully"),
        status: EStatusCodes.enum.created,
        success: true,
        data: result.data,
      };
      res.status(data.status).json(data);
    } catch (error) {
      logger.error(`Error in createUser:`, error);
      next(error);
    }
  }

  async queryUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const query = this.generateUserQuery(req.query);
      const result = await this.userUseCase.query.execute(query, req.user);
      if (!result.success) {
        throwError({
          message: "Failed to retrieve users",
          description: result.error,
          statusCode: EStatusCodes.enum.internalServerError,
          type: "Server"
        });
        return;
      }

      const data: IResponseDataPaginated<TUser> = {
        ...this.generateMetadata(req, "Users retrieved successfully"),
        success: true,
        status: EStatusCodes.enum.ok,
        ...result.data
      };
      res.status(data.status).json(data);
    } catch (error) {
      logger.error(`Error in queryUsers:`, error);
      next(error);
    }
  }

  async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId;
      const result = await this.userUseCase.get.execute({ userId }, req.user);
      if (!result.success) {
        throwError({
          message: "User not found",
          description: result.error,
          statusCode: EStatusCodes.enum.notFound,
          type: "NotFound"
        });
        return;
      }

      const data: IResponseData<TUser> = {
        ...this.generateMetadata(req, "User retrieved successfully"),
        data: {
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          email: result.data.email,
        } as TUser,
        status: EStatusCodes.enum.ok,
        success: true
      };
      res.status(data.status).json(data);
    } catch (error) {
      logger.error(`Error in getUser:`, error);
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const validate = validateData<UpdateUserDTO>(req.body, UpdateUserSchema);
      if (!validate.success) {
        throwError({
          message: "Validation failed",
          description: validate.error,
          statusCode: EStatusCodes.enum.badRequest,
          type: "Validation"
        });
        return;
      }

      const result = await this.userUseCase.update.execute(validate.data, req.user!);
      if (!result.success) {
        throwError({
          message: "User update failed",
          description: result.error,
          statusCode: EStatusCodes.enum.internalServerError,
          type: "Server"
        });
        return;
      }

      const data: IResponseData<TUser> = {
        ...this.generateMetadata(req, "User updated successfully"),
        status: EStatusCodes.enum.ok,
        success: true,
        data: result.data,
      };
      res.status(data.status).json(data);
    } catch (error) {
      logger.error(`Error in updateUser:`, error);
      next(error);
    }
  }

  async changeUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throwError({
          message: "Permission denied",
          description: "Only admins can change user status",
          statusCode: EStatusCodes.enum.forbidden,
          type: "Auth"
        });
        return;
      }

      const toChangeId = req.params.userId;
      const result = await this.userUseCase.changeStatus.execute({
        userId: toChangeId,
        isActive: true
      }, req.user);
      if (!result.success) {
        throwError({
          message: "Failed to change user status",
          description: result.error,
          statusCode: EStatusCodes.enum.internalServerError,
          type: "Server"
        });
        return;
      }

      const data: IResponseData<TUser> = {
        ...this.generateMetadata(req, "User status updated successfully"),
        data: result.data,
        status: EStatusCodes.enum.ok,
        success: true
      };
      res.status(data.status).json(data);
    } catch (error) {
      logger.error(`Error in changeUserStatus:`, error);
      next(error);
    }
  }

  async changeUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throwError({
          message: "Permission denied",
          description: "Only admins can change roles",
          statusCode: EStatusCodes.enum.forbidden,
          type: "Auth"
        });
        return;
      }

      const userId = req.params.userId;
      const role = req.body.role;
      const result = await this.userUseCase.changeRole.execute({ userId, roles: role }, req.user);
      if (!result.success) {
        throwError({
          message: "Failed to change user role",
          description: result.error,
          statusCode: EStatusCodes.enum.internalServerError,
          type: "Server"
        });
        return;
      }

      const data: IResponseData<TUser> = {
        ...this.generateMetadata(req, "User role updated successfully"),
        data: result.data,
        status: EStatusCodes.enum.ok,
        success: true
      };
      res.status(data.status).json(data);
    } catch (error) {
      logger.error(`Error in changeUserRole:`, error);
      next(error);
    }
  }

  async getAddresses(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      if (!userId) {
        throwError({
          message: "Invalid user ID",
          description: "User ID is required",
          statusCode: EStatusCodes.enum.badRequest,
          type: "Validation"
        });
        return;
      }

      const { page = 1, limit = 5, type = undefined } = req.query;
      const filter: { type?: string, userId: string } = {
        type: typeof type === "string" ? type : "",
        userId
      };
      if (!filter.type) delete filter.type;

      const result = await this.userUseCase.getAddresses.execute({ filter });
      if (!result.success) {
        throwError({
          message: "Failed to retrieve addresses",
          description: result.error,
          statusCode: EStatusCodes.enum.internalServerError,
          type: "Server"
        });
        return;
      }

      const data: IResponseDataPaginated<TAddress> = {
        ...this.generateMetadata(req, "Addresses retrieved successfully"),
        status: EStatusCodes.enum.ok,
        success: true,
        ...result.data,
      };
      res.status(data.status).json(data);
    } catch (error) {
      logger.error(`Error in getAddresses:`, error);
      next(error);
    }
  }

  async updateAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const validate = validateData<TAddress>(req.body, AddressSchema);
      if (!validate.success) {
        throwError({
          message: "Validation failed",
          description: validate.error,
          statusCode: EStatusCodes.enum.badRequest,
          type: "Validation"
        });
        return;
      }

      const result = await this.userUseCase.updateAddress.execute(validate.data);
      if (!result.success) {
        throwError({
          message: "Failed to update address",
          description: result.error,
          statusCode: EStatusCodes.enum.internalServerError,
          type: "Server"
        });
        return;
      }

      const data: IResponseData<TAddress> = {
        ...this.generateMetadata(req, "Address updated successfully"),
        status: EStatusCodes.enum.ok,
        success: true,
        data: result.data,
      };
      res.status(data.status).json(data);
    } catch (error) {
      logger.error(`Error in updateAddress:`, error);
      next(error);
    }
  }

  async addAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const validate = validateData<TAddress>(req.body, AddressSchema);
      if (!validate.success) {
        throwError({
          message: "Validation failed",
          description: validate.error,
          statusCode: EStatusCodes.enum.badRequest,
          type: "Validation"
        });
        return;
      }

      const result = await this.userUseCase.addAddress.execute(validate.data);
      if (!result.success) {
        throwError({
          message: "Failed to add address",
          description: result.error,
          statusCode: EStatusCodes.enum.internalServerError,
          type: "Server"
        });
        return;
      }

      const data: IResponseData<TAddress> = {
        ...this.generateMetadata(req, "Address added successfully"),
        status: EStatusCodes.enum.created,
        success: true,
        data: result.data,
      };
      res.status(data.status).json(data);
    } catch (error) {
      logger.error(`Error in addAddress:`, error);
      next(error);
    }
  }

  async getMeAddress(req: Request, res: Response, next: NextFunction) {
    await this.withUserId(req, res, next, this.getAddresses);
  }

  async addMeAddress(req: Request, res: Response, next: NextFunction) {
    await this.withUserId(req, res, next, this.addAddress);
  }

  async updateMeAddress(req: Request, res: Response, next: NextFunction) {
    await this.withUserId(req, res, next, this.updateAddress);
  }

  async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { custId } = req.params;
      if (!custId) {
        throwError({
          message: "Invalid customer ID",
          description: "Customer ID is required",
          statusCode: EStatusCodes.enum.badRequest,
          type: "Validation"
        });
        return;
      }

      const result = await this.userUseCase.get.execute({ custId: custId.toString() }, req.user);
      if (!result.success) {
        throwError({
          message: "User not found",
          description: result.error,
          statusCode: EStatusCodes.enum.notFound,
          type: "NotFound"
        });
        return;
      }

      const data: IResponseData<TUser> = {
        ...this.generateMetadata(req, "User details retrieved successfully"),
        status: EStatusCodes.enum.ok,
        success: true,
        data: {
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          email: result.data.email,
        } as TUser,
      };
      res.status(data.status).json(data);
    } catch (error) {
      logger.error(`Error in getUserStats:`, error);
      next(error);
    }
  }

  async getMeStats(req: Request, res: Response, next: NextFunction) {
    await this.withUserId(req, res, next, this.getUserStats);
  }

  private async withUserId(req: Request, res: Response, next: NextFunction, action: Function) {
    try {
      req.params.custId = req.user?.custId!;
      await action(req, res, next);
    } catch (error) {
      logger.error(`Error in withUserId:`, error);
      next(error);
    }
  }

  private generateMetadata(req: Request, message: string, type?: string) {
    return {
      url: req.url,
      path: req.path,
      type: type ?? "User",
      message,
    };
  }

  private generateUserQuery(query: qs.ParsedQs) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const sortOrder = query.sort_order === "desc" ? "desc" : "asc";
    const sortBy = typeof query.sort_by === 'string' && ["firstName", "lastName", "email"].includes(query.sort_by)
      ? query.sort_by
      : "firstName";
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };
    const searchTerm = typeof query.search === "string" ? query.search : "";
    const search = searchTerm
      ? {
        $or: [
          { email: { $regex: searchTerm, $options: "i" } },
          { firstName: { $regex: searchTerm, $options: "i" } },
          { lastName: { $regex: searchTerm, $options: "i" } },
        ],
      }
      : undefined;
    const filter = search ?? {
      isActive: !query.show_inactive ? true : { $in: [true, false] },
    };

    const queryOptions = {
      sort,
    };
    const projection = {
      firstName: true,
      lastName: true,
      createdAt: true,
      custId: true,
      email: true,
      id: true,
      phoneNumber: true,
      profilePictureUrl: true,
      isActive: true,
      updatedAt: true,
    };

    const options: IQueryFilters<TUser> = {
      filter,
      limit,
      page,
      projection,
      queryOptions,
    };
    return options;
  }
}

export const userControllers = new UserControllers(new UserUseCase(new UserRepositoryImpl(UserModel, AddressModel)))