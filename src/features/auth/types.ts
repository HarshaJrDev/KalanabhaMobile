


export type BackendUserRole = 'customer' | 'driver' | 'admin' | 'dispatcher' | 'warehouse';


export interface LoginPayload {
    email: string;
    password: string;
}






export interface RegisterPayload {
    email: string;
    password: string;
    displayName?: string;
    role: BackendUserRole;
    
    
    
    referralCode?: string;
}


export interface RefreshPayload {
    refreshToken: string;
}



export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
