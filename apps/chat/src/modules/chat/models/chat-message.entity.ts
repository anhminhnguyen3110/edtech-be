import { EChatRole } from '@app/common/constants/chat.constant';
import { ETableName } from '@app/common/constants/table.constant';
import { BaseEntity } from '@app/common/database/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';

import { ChatFileKeyEntity } from './chat-file-key.entity';
import { ChatTopicEntity } from './chat-topic.entity';

@Entity(ETableName.CHAT_MESSAGE)
export class ChatMessageEntity extends BaseEntity {
    @ManyToOne(() => ChatTopicEntity, topic => topic.chatMessages, {
        eager: false,
    })
    @JoinColumn({
        name: 'topic_id',
    })
    topic: ChatTopicEntity;

    @Column({
        name: 'topic_id',
    })
    topicId: number;

    @Column({
        name: 'chat_message',
    })
    message: string;

    @Column({
        name: 'chat_role',
        type: 'varchar',
    })
    role: EChatRole;

    @OneToOne(() => ChatFileKeyEntity, fileKey => fileKey.chatMessage, {
        eager: false,
        cascade: true,
    })
    chatFileKey: ChatFileKeyEntity;
}
