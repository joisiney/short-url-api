import { PaginatedResponse } from '@shared/http/contracts/paginated-response.contract';

export function createPaginatedResponse<T>(
  items: T[],
  page: number,
  pageSize: number,
  totalItems: number,
): PaginatedResponse<T> {
  return {
    items,
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
  };
}
