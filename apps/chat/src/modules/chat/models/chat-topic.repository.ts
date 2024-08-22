import { ESortDirection } from '@app/common/constants/database.constant';
import { ETableName } from '@app/common/constants/table.constant';
import { BaseRepository } from '@app/common/database/base.repository';
import { Injectable } from '@nestjs/common';
import { GetChatTopicRequestDto } from 'apps/api/src/modules/chat/dtos/get-chat-request.dto';
import { DataSource } from 'typeorm';

import { ChatTopicEntity } from './chat-topic.entity';

@Injectable()
export class ChatTopicRepository extends BaseRepository<ChatTopicEntity> {
    constructor(private readonly dataSource: DataSource) {
        super(ChatTopicEntity, dataSource, ETableName.CHAT_TOPIC);
    }

    async getChatTopicPagination(
        getChatTopicRequestDto: GetChatTopicRequestDto,
        accountId: number,
    ): Promise<[ChatTopicEntity[], number]> {
        const qb = this.createQb();
        qb.where('account_id = :accountId', { accountId });
        if (!getChatTopicRequestDto.sortBy) {
            getChatTopicRequestDto.sortBy = 'updatedAt';
        }

        if (!getChatTopicRequestDto.sortDirection) {
            getChatTopicRequestDto.sortDirection = ESortDirection.DESC;
        }

        this.qbPagination(qb, getChatTopicRequestDto);

        return qb.getManyAndCount();
    }

    async getQueryRunner() {
        return this.dataSource.createQueryRunner();
    }
}
