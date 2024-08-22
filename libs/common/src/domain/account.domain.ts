// src/domain/account.domain.ts
import { Expose } from 'class-transformer';

import { ERole } from '../constants/role.constant';

export class Account {
    @Expose({
        name: 'id',
    })
    public id?: number;
    public email?: string;
    public hashedPassword?: string;
    public name?: string;
    public sessionHash?: string | null;
    public isActivated?: boolean;
    public role?: ERole;
    public createdAt?: Date;
    public updatedAt?: Date;
    public teacherId?: number;
}
