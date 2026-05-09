// utils/firestoreDate.ts
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export const parseFirestoreDate = (
    value: unknown
): string | undefined => {
    if (!value) return undefined;

    // ✅ Firestore Timestamp
    if (
        typeof value === 'object' &&
        value !== null &&
        'toDate' in value
    ) {
        return (value as FirebaseFirestoreTypes.Timestamp)
            .toDate()
            .toISOString();
    }

    // ✅ number (epoch)
    if (typeof value === 'number') {
        return new Date(value).toISOString();
    }

    // ✅ string
    if (typeof value === 'string') {
        return new Date(value).toISOString();
    }

    return undefined;
};