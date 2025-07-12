interface BaseResponseData {
  status: number;
  message: string;
  description?: string;
  url?: string;
  path?: string;
  type?: string;
}

interface ResErr extends BaseResponseData {
  success: false;
  error?: { message: string };
  data?: null;
}

interface ResSuccess<TData> extends BaseResponseData {
  success: true;
  data: TData;
  redirect?: {
    path: string;
  };
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

export type IResponseData<TData> = ResSuccess<TData> | ResErr;
export type IResponseDataPaginated<TData> = Pagination<TData> | ResErr;
