// src/mappers/account.mapper.ts
import { Account } from '@app/common/domain/account.domain';

import { AccountEntity } from '../models/account.entity';

export class AccountMapper {
    // Map AccountEntity to Account
    public static toDomain(entity: AccountEntity): Account {
        const domain = new Account();
        domain.id = entity.id;
        domain.email = entity.email;
        domain.hashedPassword = entity.hashedPassword;
        domain.name = entity.name;
        domain.isActivated = entity.isActivated;
        domain.role = entity.role;
        domain.createdAt = entity.createdAt;
        domain.updatedAt = entity.updatedAt;
        return domain;
    }

    // Map Account to AccountEntity
    public static toEntity(domain: Account): AccountEntity {
        const entity = new AccountEntity();
        entity.email = domain.email;
        entity.hashedPassword = domain.hashedPassword;
        entity.name = domain.name;
        entity.role = domain.role;
        entity.isActivated = domain.isActivated;
        entity.createdAt = domain.createdAt;
        entity.updatedAt = domain.updatedAt;
        return entity;
    }
}
