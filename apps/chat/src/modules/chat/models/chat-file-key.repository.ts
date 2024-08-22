import { ETableName } from '@app/common/constants/table.constant';
import { BaseRepository } from '@app/common/database/base.repository';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ChatFileKeyEntity } from './chat-file-key.entity';

@Injectable()
export class ChatFileKeyRepository extends BaseRepository<ChatFileKeyEntity> {
    constructor(private readonly dataSource: DataSource) {
        super(ChatFileKeyEntity, dataSource, ETableName.CHAT_MESSAGE);
    }
}
