import { apiClient } from '../../../src/api/client';
import type { ApiSuccessResponse } from '../../../src/api/types';
import type { StoredUser } from '../../../src/services/storage';

// GET /users/me — kalanabhaBackend UsersController.me
export const getMe = async (): Promise<StoredUser> => {
    const { data } = await apiClient.get<ApiSuccessResponse<StoredUser>>('/users/me');
    return data.data;
};
