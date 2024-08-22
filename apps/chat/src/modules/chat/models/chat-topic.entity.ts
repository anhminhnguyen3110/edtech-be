import { ETableName } from '@app/common/constants/table.constant';
import { BaseEntity } from '@app/common/database/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';

import { ChatMessageEntity } from './chat-message.entity';

@Entity(ETableName.CHAT_TOPIC)
export class ChatTopicEntity extends BaseEntity {
    @Column({
        name: 'topic_name',
        default: 'Untitled',
    })
    topicName: string;

    @Column({
        name: 'account_id',
        nullable: false,
    })
    accountId: number;

    @Column({
        name: 'document_id',
        nullable: false,
    })
    documentId: string;

    @OneToMany(() => ChatMessageEntity, chatMessage => chatMessage.topic, {
        eager: false,
        cascade: true,
    })
    chatMessages: ChatMessageEntity[];
}
