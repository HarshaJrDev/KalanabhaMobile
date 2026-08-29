// Matches kalanabhaBackend/src/modules/auth/types/auth.types.ts exactly —
// the backend lowercases this on the wire; Prisma's UserRole enum (the
// shape GET /users/me returns) is the uppercase form of the same values.
export type BackendUserRole = 'customer' | 'driver' | 'admin' | 'dispatcher' | 'warehouse';

// POST /auth/login — kalanabhaBackend LoginDto
export interface LoginPayload {
    email: string;
    password: string;
}

// POST /auth/register — kalanabhaBackend RegisterDto
// NOTE: the backend only accepts these four fields at registration. Phone,
// address, and customerType (collected on the Signup screen) have no
// matching field on RegisterDto/AuthRepository.createUser and are NOT sent —
// there is no endpoint to persist them yet.
export interface RegisterPayload {
    email: string;
    password: string;
    displayName?: string;
    role: BackendUserRole;
}

// POST /auth/refresh — kalanabhaBackend RefreshTokenDto
export interface RefreshPayload {
    refreshToken: string;
}

// Shared response shape for /auth/login, /auth/register, /auth/refresh
// (AuthService.issueTokens)
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
