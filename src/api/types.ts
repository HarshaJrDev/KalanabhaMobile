export interface ApiSuccessResponse<T> {
    success: true;
    data: T;
    message?: string;
}

export interface NestErrorResponse {
    statusCode: number;
    message: string | string[];
    error?: string;
}

export interface PaginatedResult<T> {
    items: T[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export class ApiError extends Error {
    readonly status?: number;
    readonly errors?: string[];

    constructor(message: string, status?: number, errors?: string[]) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.errors = errors;
    }
}
