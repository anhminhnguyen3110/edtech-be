export enum EChatRole {
    SYSTEM = 'system',
    USER = 'user',
    ASSISTANT = 'assistant',
}

export interface IChatMessage {
    role: EChatRole;
    content: string;
}

export class IChatPayload {
    messages: IChatMessage[];
    temperature: number;
}
