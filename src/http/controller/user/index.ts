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

export class UserControllers {
  constructor(
    private readonly userUseCase: UserUseCase,
  ) {
    this.queryUsers = this.queryUsers.bind(this)
    this.createUser = this.createUser.bind(this)
    this.getMe = this.getMe.bind(this)
    this.getUser = this.getUser.bind(this)
  }
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        const data: IResponseData<null> = {
          ...this.generateMetadata(req, "User not found"),
          status: EStatusCodes.enum.notFound,
          success: false,
          data: null
        };
        res.status(data.status).json(data);
        return;
      }

      const data: IResponseData<TUser> = {
        ...this.generateMetadata(req, "User profile retrieved successfully"),
        data: req.user as TUser,
        status: EStatusCodes.enum.ok,
        success: true
      };
      res.status(data.status).json(data);
    } catch (error) {
      next(error);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const validate = validateData<CreateUserDTO>(req.body, CreateUserSchema);
      if (!validate.success) {
        const data: IResponseData<null> = {
          ...this.generateMetadata(req, "Invalid input data"),
          status: EStatusCodes.enum.badRequest,
          success: false,
          error: { message: "Invalid input data" },
          data: null
        };
        res.status(data.status).json(data);
        return;
      }

      const result = await this.userUseCase.create.execute(validate.data);
      if (!result.success) {
        const data: IResponseData<null> = {
          ...this.generateMetadata(req, result.error),
          status: EStatusCodes.enum.badRequest,
          success: false,
          error: { message: result.error },
          data: null
        };
        res.status(data.status).json(data);
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
      next(error);
    }
  }

  async queryUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const query = this.generateUserQuery(req.query)
      const result = await this.userUseCase.query.execute(query, req.user);
      if (!result.success) {
        const data: IResponseData<null> = {
          ...this.generateMetadata(req, result.error),
          status: result.status ?? EStatusCodes.enum.badGateway,
          success: false,
          error: { message: result.error ?? "Failed to retrieve users" },
          data: null
        };
        res.status(data.status).json(data);
        return;
      }
      const data: IResponseDataPaginated<TUser> = {
        ...this.generateMetadata(req, "Users retrieved successfully"),
        success: true,
        status: EStatusCodes.enum.ok,
        ...result.data
      }
      res.status(data.status).json(data);
    } catch (error) {
      next(error);
    }
  }

  async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const custId = req.params.custId;
      const result = await this.userUseCase.get.execute({ custId }, req.user);
      if (!result.success) {
        const data: IResponseData<null> = {
          ...this.generateMetadata(req, "User not found"),
          status: result.status ?? EStatusCodes.enum.notFound,
          success: false,
          error: { message: "User not found" },
          data: null
        };
        res.status(data.status).json(data);
        return;
      }

      const data: IResponseData<TUser> = {
        ...this.generateMetadata(req, "User retrieved successfully"),
        data: result.data,
        status: EStatusCodes.enum.ok,
        success: true
      };

      res.status(data.status).json(data);

    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const validate = validateData<UpdateUserDTO>(req.body, UpdateUserSchema);
      if (!validate.success) {
        const data: IResponseData<null> = {
          ...this.generateMetadata(req, "Invalid input data"),
          status: EStatusCodes.enum.badRequest,
          success: false,
          error: { message: "Invalid input data" },
          data: null
        };
        res.status(data.status).json(data);
        return;
      }

      const result = await this.userUseCase.update.execute(validate.data, req.user!);
      if (!result.success) {
        const data: IResponseData<null> = {
          ...this.generateMetadata(req, "Failed to update user"),
          success: false,
          status: result.status ?? EStatusCodes.enum.conflict,
          error: { message: result.error ?? "Failed to update user" },
          data: null
        };
        res.status(data.status).json(data);
        return;
      }
      const data: IResponseData<TUser> = {
        ...this.generateMetadata(req, "User updated successfully"),
        status: EStatusCodes.enum.ok,
        success: true,
        data: result.data
      }
      res.status(data.status).json(data);
    } catch (error) {
      next(error);
    }
  }

  async changeUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const toChangeId = req.params.userId
      const result = await this.userUseCase.changeStatus.execute({
        userId: toChangeId,
        isActive: true
      }, req.user!);
      if (!result.success) {
        const data: IResponseData<null> = {
          ...this.generateMetadata(req, "Failed to change user status"),
          status: result.status ?? EStatusCodes.enum.badGateway,
          success: false,
          error: { message: result.error ?? "Failed to change user status" },
          data: null
        };
        res.status(data.status).json(data);
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
      next(error);
    }
  }

  async changeUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId;
      const role = req.body.role;

      const result = await this.userUseCase.changeRole.execute({ userId, roles: role }, req.user!);
      if (!result.success) {
        const data: IResponseData<null> = {
          ...this.generateMetadata(req, "Failed to change user role"),
          status: result.status ?? EStatusCodes.enum.badGateway,
          success: false,
          error: { message: result.error ?? "Failed to change user role" },
          data: null
        };
        res.status(data.status).json(data);
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
      next(error);
    }
  }
  async getAddresses(req: Request, res: Response, next: NextFunction) {
    try {
      const { custId } = req.params;
      if (!custId) {
        const data: IResponseData<null> = {
          ...this.generateMetadata(req, "Customer ID is required"),
          status: EStatusCodes.enum.badRequest,
          success: false,
          error: { message: "Customer ID is required" },
          data: null
        };
        res.status(data.status).json(data);
        return;
      }
      const { page = 1, limit = 5, type = undefined } = req.query
      const filter: { type?: string, custId: string } = {
        type: type?.toString(),
        custId
      }
      if (!filter.type)
        delete filter.type

      const result = await this.userUseCase.getAddresses.execute({
        filter
      });
      if (!result.success) {
        const data: IResponseDataPaginated<TAddress> = {
          ...this.generateMetadata(req, "Failed to retrieve addresses"),
          status: result.status ?? EStatusCodes.enum.notFound,
          success: false,
          error: { message: result.error ?? "Failed to retrieve addresses" },
        };
        res.status(data.status).json(data);
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
      next(error);
    }
  }
  async updateAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const validate = validateData<TAddress>(req.body, AddressSchema);
      if (!validate.success) {
        const data: IResponseData<null> = {
          ...this.generateMetadata(req, "Invalid input data"),
          status: EStatusCodes.enum.badRequest,
          success: false,
          error: { message: "Invalid input data" },
          data: null
        };
        res.status(data.status).json(data);
        return;
      }

      const result = await this.userUseCase.updateAddress.execute(validate.data);
      if (!result.success) {
        const data: IResponseData<null> = {
          ...this.generateMetadata(req, "Failed to update address"),
          status: result.status ?? EStatusCodes.enum.conflict,
          success: false,
          error: { message: result.error ?? "Failed to update address" },
          data: null
        };
        res.status(data.status).json(data);
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
      next(error);
    }
  }
  async addAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const validate = validateData<TAddress>(req.body, AddressSchema);
      if (!validate.success) {
        const data: IResponseData<null> = {
          ...this.generateMetadata(req, "Invalid input data"),
          status: EStatusCodes.enum.badRequest,
          success: false,
          error: { message: "Invalid input data" },
          data: null
        };
        res.status(data.status).json(data);
        return;
      }

      const result = await this.userUseCase.addAddress.execute(validate.data);
      if (!result.success) {
        const data: IResponseData<null> = {
          ...this.generateMetadata(req, "Failed to add address"),
          status: result.status ?? EStatusCodes.enum.conflict,
          success: false,
          error: { message: result.error ?? "Failed to add address" },
          data: null
        };
        res.status(data.status).json(data);
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
      next(error);
    }
  }
  async getMeAddress(req: Request, res: Response, next: NextFunction) {
    try {
      req.params.custId = req.user?.custId!
      await this.getAddresses(req, res, next)
    } catch (error) {
      next(error);
    }
  }

  async addMeAddress(req: Request, res: Response, next: NextFunction) {
    try {
      req.params.custId = req.user?.custId!
      await this.addAddress(req, res, next)
    } catch (error) {
      next(error);
    }
  }

  async updateMeAddress(req: Request, res: Response, next: NextFunction) {
    try {
      req.params.custId = req.user?.custId!
      await this.updateAddress(req, res, next)
    } catch (error) {
      next(error);
    }
  }

  async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { custId } = req.params;
      if (!custId) {
        const data: IResponseData<null> = {
          ...this.generateMetadata(req, "User ID is required"),
          status: EStatusCodes.enum.badRequest,
          success: false,
          error: { message: "User ID is required" },
          data: null
        };
        res.status(data.status).json(data);
        return;
      }
      const result = await this.userUseCase.get.execute({ custId: custId.toString() }, req.user);
      if (!result.success) {
        const data: IResponseData<null> = {
          ...this.generateMetadata(req, "Failed to retrieve user details"),
          status: result.status ?? EStatusCodes.enum.notFound,
          success: false,
          error: { message: result.error ?? "Failed to retrieve user details" },
          data: null
        };
        res.status(data.status).json(data);
        return;
      }

      const data: IResponseData<TUser> = {
        ...this.generateMetadata(req, "User details retrieved successfully"),
        status: EStatusCodes.enum.ok,
        success: true,
        data: result.data,
      };
      res.status(data.status).json(data);
    } catch (error) {
      next(error);
    }
  }

  async getMeStats(req: Request, res: Response, next: NextFunction) {
    try {
      req.params.custId = req.user?.custId!
      await this.getUserStats(req, res, next)
    } catch (error) {
      next(error);
    }
  }

  private generateMetadata(req: Request, message: string, type?: string) {
    return ({
      url: req.url,
      path: req.path,
      type: type ?? "User",
      message,
    })
  }
  private generateUserQuery(query: qs.ParsedQs) {
    let {
      page = 1,
      limit = 10,
      sort_order = "asc",
      sort_by = "firstName"
    } =
      query;
    if (sort_by === 'name') {
      sort_by = 'firstName'
    }
    const sortByStr = String(sort_by);
    const sortOrderStr = String(sort_order);
    const sort = { [sortByStr]: sortOrderStr === 'desc' ? -1 : 1 }
    const searchTerm = typeof query.search === 'string' ? query.search : '';
    const search = searchTerm ? {
      $or: [
        { email: { $regex: searchTerm, $options: 'i' } },
        { firstName: { $regex: searchTerm, $options: 'i' } },
        { lastName: { $regex: searchTerm, $options: 'i' } }
      ]
    } : undefined;
    const filter = search ?? {
      isActive: !query.show_inactive ? true : { "$in": [true, false] },
    }

    const queryOptions = {
      sort
    }
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
      updatedAt: true
    }

    const options: IQueryFilters<TUser> = {
      filter,
      limit: Number(limit ?? 10),
      page: Number(page ?? 1),
      projection,
      queryOptions
    }
    return options
  }
}

export const userControllers = new UserControllers(new UserUseCase(new UserRepositoryImpl(UserModel, AddressModel)))