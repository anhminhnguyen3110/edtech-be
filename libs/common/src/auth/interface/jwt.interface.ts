export interface IJwtPayload {
    role: string;
    email: string;
    hash: string;
    id: number;
}

export interface IJwtRefreshPayload {
    sessionId: number;
    hash: string;
}

export interface IJwtTransferPayload extends IJwtPayload, IJwtRefreshPayload {}
