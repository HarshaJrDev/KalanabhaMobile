import { create } from 'zustand';
import type { ImageSourcePropType } from 'react-native';






interface SuccessModalOptions {
    illustration: ImageSourcePropType;
    title: string;
    message?: string;
    buttonLabel?: string;
}

interface SuccessModalStore extends SuccessModalOptions {
    open: boolean;
}

export const useSuccessModalStore = create<SuccessModalStore>(() => ({
    open: false,
    illustration: undefined as unknown as ImageSourcePropType,
    title: '',
    message: undefined,
    buttonLabel: undefined,
}));

export const showSuccessModal = (options: SuccessModalOptions) => {
    useSuccessModalStore.setState({ ...options, open: true });
};
