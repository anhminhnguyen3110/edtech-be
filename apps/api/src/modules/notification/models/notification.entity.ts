import { ETableName } from '@app/common/constants/table.constant';
import { ENotificationEventType } from '@app/common/constants/ws.constant';
import { BaseEntity } from '@app/common/database/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AccountEntity } from '../../account/models/account.entity';

@Entity(ETableName.NOTIFICATION)
export class NotificationEntity extends BaseEntity {
    @Column({ name: 'account_id' })
    accountId: number;

    @Column({ name: 'message' })
    message: string;

    @Column({ name: 'class_assignment_id' })
    classAssignmentId: number;

    @Column({ name: 'is_read', type: 'boolean', default: false })
    isRead: boolean;

    @ManyToOne(() => AccountEntity, account => account.notifications)
    @JoinColumn({ name: 'account_id' })
    account: AccountEntity;

    @Column({ name: 'event_type', type: 'varchar', length: 255 })
    eventType: ENotificationEventType;
}
