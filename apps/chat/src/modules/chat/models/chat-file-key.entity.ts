import { EChatFileType, ETableName } from '@app/common/constants/table.constant';
import { BaseEntity } from '@app/common/database/base.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

import { ChatMessageEntity } from './chat-message.entity';

@Entity(ETableName.CHAT_FILE_KEY)
export class ChatFileKeyEntity extends BaseEntity {
    @OneToOne(() => ChatMessageEntity, message => message.chatFileKey, {
        eager: false,
    })
    @JoinColumn({
        name: 'chat_message_id',
    })
    chatMessage: ChatMessageEntity;

    @Column({
        name: 'chat_message_id',
        nullable: false,
    })
    chatMessageId: number;

    @Column({
        name: 'file_name',
        nullable: false,
    })
    fileName: string;

    @Column({
        name: 'file_type',
        type: 'varchar',
        nullable: false,
    })
    fileType: EChatFileType;

    @Column({
        name: 'file_code',
        nullable: false,
    })
    fileCode: string;
}
