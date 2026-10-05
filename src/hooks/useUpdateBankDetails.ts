import { useMutation } from '@tanstack/react-query';
import { updateBankDetails, type UpdateBankDetailsPayload } from '@features/users/api/users.api';

export const useUpdateBankDetails = () => {
    return useMutation({
        mutationFn: (payload: UpdateBankDetailsPayload) => updateBankDetails(payload),
    });
};
