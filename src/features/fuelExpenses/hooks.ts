import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as fuelExpensesApi from './api/fuelExpenses.api';
import type { CreateFuelExpenseInput } from './types';
import { useAuthState } from '@hooks/useAuthState';

export const fuelExpenseKeys = {
    mine: ['fuel-expenses', 'mine'] as const,
};

export const useMyFuelExpenses = () => {
    const { isAuthenticated } = useAuthState();
    return useQuery({
        queryKey: fuelExpenseKeys.mine,
        queryFn: fuelExpensesApi.getMyFuelExpenses,
        enabled: isAuthenticated,
    });
};

export const useLogFuelExpense = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateFuelExpenseInput) => fuelExpensesApi.createFuelExpense(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: fuelExpenseKeys.mine });
        },
    });
};
