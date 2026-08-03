export class PaginationQueryDto {
  page: number = 1;
  limit: number = 20;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
