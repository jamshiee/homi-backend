export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  message: string;
  meta?: PaginationMeta;
  error?: ApiError;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  details?: unknown;
}
