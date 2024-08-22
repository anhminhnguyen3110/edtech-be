import { ETableName } from '@app/common/constants/table.constant';
import { BaseRepository } from '@app/common/database/base.repository';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { GetAccountRequestDto } from '../dtos/get-account-request.dto';
import { AccountEntity } from './account.entity';

@Injectable()
export class AccountRepository extends BaseRepository<AccountEntity> {
    constructor(private readonly dataSource: DataSource) {
        super(AccountEntity, dataSource, ETableName.ACCOUNT);
    }

    public async getAccounts(
        getAccountsDto: GetAccountRequestDto,
    ): Promise<[AccountEntity[], number]> {
        const qb = this.createQb();

        if (getAccountsDto.email) {
            qb.andWhere(`${this.alias}.email = :email`, {
                email: getAccountsDto.email,
            });
        }

        if (getAccountsDto.name) {
            qb.andWhere(`${this.alias}.name = :name`, {
                name: getAccountsDto.name,
            });
        }

        if (getAccountsDto.role) {
            qb.andWhere(`${this.alias}.role = :role`, {
                role: getAccountsDto.role,
            });
        }

        this.qbPagination(qb, getAccountsDto);

        return qb.getManyAndCount();
    }
}
