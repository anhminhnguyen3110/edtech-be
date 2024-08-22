import { ERole } from '@app/common/constants/role.constant';
import { ETableName } from '@app/common/constants/table.constant';
import { BaseEntity } from '@app/common/database/base.entity';
import { hashPassword } from 'apps/api/src/shared/password';
import { BeforeInsert, Column, Entity, Index, OneToMany, OneToOne } from 'typeorm';

import { NotificationEntity } from '../../notification/models/notification.entity';
import { SessionEntity } from '../../session/models/session.entity';

@Entity(ETableName.ACCOUNT)
export class AccountEntity extends BaseEntity {
    @Column({ unique: true })
    @Index()
    email: string;

    @Column({ name: 'hash_password' })
    hashedPassword: string;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: ERole,
        default: ERole.TEACHER,
    })
    role: ERole;

    @Column({
        name: 'is_activated',
        nullable: true,
        type: 'boolean',
        default: false,
    })
    isActivated: boolean;

    @Column({
        name: 'verified_hash',
        nullable: true,
    })
    verifiedHash: string;

    @OneToOne(() => SessionEntity, session => session.account)
    session: SessionEntity;

    @OneToMany(() => NotificationEntity, notification => notification.account)
    notifications: NotificationEntity[];

    @BeforeInsert()
    async hashedPasswordBeforeInsert() {
        this.hashedPassword = await hashPassword(this.hashedPassword);
    }
}
