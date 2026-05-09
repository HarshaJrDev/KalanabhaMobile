import { useMutation } from "@tanstack/react-query";
import { RegisterPayload, registerUser } from "../features/auth/api/register";
import { useAuthStore } from "../features/store/authStore";


export const useRegister = () => {
    const setUser = useAuthStore((s) => s.setUser);

    return useMutation({
        mutationFn: (payload: RegisterPayload) =>
            registerUser(payload),

        onSuccess: (data) => {
            setUser(data);
        },
    });
};