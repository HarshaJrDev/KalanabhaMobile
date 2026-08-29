export const safeNumber = (val: unknown, fallback = 0): number => {
    if (typeof val === 'number' && !Number.isNaN(val)) return val;
    if (typeof val === 'string') {
        const parsed = Number(val);
        return Number.isNaN(parsed) ? fallback : parsed;
    }
    return fallback;
};
