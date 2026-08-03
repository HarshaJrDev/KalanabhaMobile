export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: unknown;
}

export class ApiResponseBuilder {
  static success<T>(data: T, message?: string): ApiSuccessResponse<T> {
    return { success: true, data, message };
  }

  static error(message: string, errors?: unknown): ApiErrorResponse {
    return { success: false, message, errors };
  }
}
