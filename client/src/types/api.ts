export type CommonResponse<T> = {
  isSuccessFull: boolean;
  data: T;
  code?: string;
  message?: string;
};

export type PageRequestDto<TFilter> = {
  maxResultCount: number;
  skipCount: number;
  sorting?: string;
  filter: TFilter;
};

export type PageResult<TEntity> = {
  totalCount: number;
  data: TEntity[];
};


