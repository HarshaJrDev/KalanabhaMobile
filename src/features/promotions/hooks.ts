import { useMutation } from '@tanstack/react-query';
import * as promotionsApi from './api';

export const useValidatePromoCode = () =>
    useMutation({
        mutationFn: ({ code, amount }: { code: string; amount: number }) => promotionsApi.validatePromoCode(code, amount),
    });
