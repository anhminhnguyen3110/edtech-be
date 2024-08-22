import { ESortDirection } from '@app/common/constants/database.constant';
import { ETableName } from '@app/common/constants/table.constant';
import { BaseRepository } from '@app/common/database/base.repository';
import { Injectable } from '@nestjs/common';
import { GetChatMessageRequestDto } from 'apps/api/src/modules/chat/dtos/get-chat-request.dto';
import { DataSource } from 'typeorm';

import { ChatMessageEntity } from './chat-message.entity';

@Injectable()
export class ChatMessageRepository extends BaseRepository<ChatMessageEntity> {
    constructor(private readonly dataSource: DataSource) {
        super(ChatMessageEntity, dataSource, ETableName.CHAT_MESSAGE);
    }

    async getChatMessagePagination(
        topicId: number,
        getChatMessageRequestDto: GetChatMessageRequestDto,
    ): Promise<[ChatMessageEntity[], number]> {
        const qb = this.createQb();

        if (!getChatMessageRequestDto?.sortBy) {
            getChatMessageRequestDto.sortBy = 'updatedAt';
        }

        if (!getChatMessageRequestDto?.sortDirection) {
            getChatMessageRequestDto.sortDirection = ESortDirection.DESC;
        }

        qb.leftJoinAndSelect(`${this.alias}.chatFileKey`, 'chatFileKey');
        qb.where(`${this.alias}.topicId = :topicId`, { topicId });

        this.qbPagination(qb, getChatMessageRequestDto);

        return qb.getManyAndCount();
    }
}
