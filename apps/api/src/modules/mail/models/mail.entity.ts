import { EMailStatus, EMailType, ETableName } from '@app/common/constants/table.constant';
import { BaseEntity } from '@app/common/database/base.entity';
import { Column, Entity } from 'typeorm';

@Entity(ETableName.MAIL)
export class MailEntity extends BaseEntity {
    @Column({ name: 'subject', length: 255 })
    subject: string;

    @Column({ name: 'from_email', length: 255 })
    from: string;

    @Column({ name: 'to_email', length: 255 })
    to: string;

    @Column({ name: 'body', type: 'text' })
    body: string;

    @Column({ name: 'status', type: 'varchar', length: 255 })
    status: EMailStatus;

    @Column({ name: 'type', type: 'varchar', length: 255 })
    type: EMailType;
}
