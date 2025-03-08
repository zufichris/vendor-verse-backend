import mongoose from "mongoose";
interface BaseResponseData {
  status: number;
  message: string;
  description?: string;
  url?: string;
  path?: string;
  type?: string;
}

interface ResErr extends BaseResponseData {
  success: false
  error?: { message: string };
  data?: null
  stack?: any;
}
interface ResSuccess<TData> extends BaseResponseData {
  success: true,
  data: TData,
  redirect?: {
    path: string;
  };
  fieldsModified?: number;
  documentsModified?: number;
}


interface Pagination<TData> extends ResSuccess<TData[]> {
  page: number;
  limit: number;
  totalPages: number;
  filterCount: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  firstItemIndex: number;
  lastItemIndex: number;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  nextPage?: number;
  previousPage?: number;
}
export type IResponseData<TData> = ResSuccess<TData> | ResErr
export type IResponseDataPaginated<TData> = Pagination<TData> | ResErr

export interface IQueryFilters<TData> {
  page?: number,
  limit?: number,
  filter?: mongoose.FilterQuery<TData>,
  projection?: mongoose.ProjectionType<TData>,
  queryOptions?: mongoose.QueryOptions<TData>,
}

export interface IQueryResult<TData = unknown> {
  page: number;
  limit: number;
  totalPages: number;
  filterCount: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  firstItemIndex: number;
  lastItemIndex: number;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  nextPage?: number;
  previousPage?: number;
  data: TData[]
}

export type ID = string | number;
