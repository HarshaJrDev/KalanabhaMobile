/**
 * Mirrors kalanabhaBackend/src/shared/api-response/api-response.ts exactly.
 * Every 2xx response from the API is wrapped this way.
 */
export interface ApiSuccessResponse<T> {
    success: true;
    data: T;
    message?: string;
}

/**
 * Nest's default HttpException JSON shape (no global exception filter is
 * registered on the backend — see kalanabhaBackend/src/filters/ — so error
 * bodies do NOT use ApiResponseBuilder.error(); they look like this).
 * `message` is a string for most thrown exceptions, or a string[] for
 * class-validator ValidationPipe failures.
 */
export interface NestErrorResponse {
    statusCode: number;
    message: string | string[];
    error?: string;
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
