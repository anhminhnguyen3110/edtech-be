import { ETableName } from '@app/common/constants/table.constant';
import { BaseEntity } from '@app/common/database/base.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

import { AccountEntity } from '../../account/models/account.entity';

@Entity(ETableName.SESSION)
export class SessionEntity extends BaseEntity {
    @Column({ name: 'random_hash' })
    randomHash: string;

    @OneToOne(() => AccountEntity, account => account.session, {
        eager: true,
    })
    @JoinColumn({ name: 'account_id' })
    account: AccountEntity;

    @Column({ name: 'account_id' })
    accountId: number;
}
