export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export function paginate(query: PaginationQuery) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(50, Math.max(1, query.limit || 20));
  return { page, limit, skip: (page - 1) * limit };
}

export function paginationMeta(
  total: number,
  page: number,
  limit: number,
): { page: number; limit: number; total: number; totalPages: number } {
  return { page, limit, total, totalPages: Math.ceil(total / limit) || 0 };
}
