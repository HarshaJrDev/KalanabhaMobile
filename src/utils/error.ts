export const normalizeError = (err: unknown): string => {
    if (typeof err === 'string') return err;

    if (err instanceof Error) return err.message;

    if (
        typeof err === 'object' &&
        err !== null &&
        'message' in err &&
        typeof (err as any).message === 'string'
    ) {
        return (err as any).message;
    }

    return 'Something went wrong. Please try again.';
};