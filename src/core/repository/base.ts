import mongoose, {
  FilterQuery,
  QueryOptions,
  ProjectionType,
  UpdateQuery,
  PipelineStage,
  AggregateOptions,
} from "mongoose";

export interface PaginationResult<T> {
  data: T[];
  totalCount: number;
  filterCount: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginationOptions<T> {
  filter?: FilterQuery<T>;
  projection?: ProjectionType<T>;
  options?: QueryOptions<T>;
  page?: number;
  limit?: number;
}

export interface IBaseRepository<T> {
  findOne(
    filter?: FilterQuery<T>,
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>,
  ): Promise<T | null>;
  findById(
    id: string,
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>,
  ): Promise<T | null>;
  count(filter?: FilterQuery<T>): Promise<number>;
  find(
    filter?: FilterQuery<T>,
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>,
  ): Promise<T[]>;
  paginate(
    paginationOptions?: PaginationOptions<T>,
  ): Promise<PaginationResult<T>>;
  create(data: Partial<T>): Promise<T>;
  updateOne(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options?: QueryOptions<T>,
  ): Promise<T | null>;
  updateById(
    id: string,
    update: UpdateQuery<T>,
    options?: QueryOptions<T>,
  ): Promise<T | null>;
  deleteOne(filter: FilterQuery<T>): Promise<boolean>;
  deleteById(id: string): Promise<boolean>;
  exists(filter: FilterQuery<T>): Promise<boolean>;
}

export class BaseRepository<T extends Record<string, any>>
  implements IBaseRepository<T>
{
  constructor(
    protected readonly model: mongoose.Model<T & mongoose.Document<T>>,
  ) {
    this.findOne = this.findOne.bind(this);
  }

  async findOne(
    filter: FilterQuery<T> = {},
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>,
  ): Promise<T | null> {
    const result = await this.model.findOne(filter, projection, options);
    return result?.toJSON() as T;
  }

  async findById(
    id: string,
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>,
  ): Promise<T | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const result = await this.model.findById(id, projection, options);
    return result?.toJSON() as T;
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  async find(
    filter: FilterQuery<T> = {},
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>,
  ): Promise<T[]> {
    const result = await this.model.find(filter, projection, options);
    return result.map((doc) => doc.toJSON());
  }

  async paginate(
    paginationOptions: PaginationOptions<T> = {},
  ): Promise<PaginationResult<T>> {
    const {
      filter = {},
      projection,
      options = {},
      page = 1,
      limit = 10,
    } = paginationOptions;

    const skip = (page - 1) * limit;

    const queryOptions: QueryOptions<T> = {
      ...options,
      skip,
      limit,
    };

    const [data, filterCount, totalCount] = await Promise.all([
      this.model.find(filter, projection, queryOptions).exec(),
      this.model.countDocuments(filter).exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;
    return {
      totalCount,
      data,
      page,
      limit,
      filterCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }
  async aggregate(pipleline: PipelineStage[], options: AggregateOptions) {
    return this.model.aggregate(pipleline, options).exec();
  }
  async create(data: Partial<T>): Promise<T> {
    const result = await this.model.create(data);
    return result.toJSON() as T;
  }

  async updateOne(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options?: QueryOptions<T>,
  ): Promise<T | null> {
    const defaultOptions: QueryOptions<T> = {
      new: true,
      runValidators: true,
      ...options,
    };

    const result = await this.model
      .findOneAndUpdate(filter, update, defaultOptions)
      .exec();
    return result?.toJSON() as T;
  }

  async updateById(
    id: string,
    update: UpdateQuery<T>,
    options?: QueryOptions<T>,
  ): Promise<T | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const defaultOptions: QueryOptions<T> = {
      new: true,
      runValidators: true,
      ...options,
    };

    const result = await this.model
      .findByIdAndUpdate(id, update, defaultOptions)
      .exec();
    return result?.toJSON() as T;
  }

  async deleteOne(filter: FilterQuery<T>): Promise<boolean> {
    const result = await this.model.findOneAndDelete(filter).exec();
    return result !== null;
  }

  async deleteById(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return false;
    }

    const result = await this.model.findByIdAndDelete(id).exec();
    return result !== null;
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const result = await this.model.exists(filter).exec();
    return result !== null;
  }
}
