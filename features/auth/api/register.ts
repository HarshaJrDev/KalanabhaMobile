import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../src/services/firebase';


export type UserType = 'HOME' | 'ELECTRIC' | 'SHOP';

export interface RegisterPayload {
    name: string;
    email: string;
    phone: string;
    address: string;
    type: UserType;
    password: string;
}

export interface RegisterResponse {
    uid: string;
    email: string;
}

export const registerUser = async (
    payload: RegisterPayload
): Promise<RegisterResponse> => {
    try {
        const cred = await createUserWithEmailAndPassword(
            auth,
            payload.email,
            payload.password
        );

        await setDoc(doc(db, 'users', cred.user.uid), {
            ...payload,
            uid: cred.user.uid,
            createdAt: serverTimestamp(),
        });

        return {
            uid: cred.user.uid,
            email: payload.email,
        };
    } catch (error: unknown) {
        throw new Error('REGISTER_FAILED');
    }
};