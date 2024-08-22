import { FileModule } from '@app/common/file/file.module';
import { LanguageModelModule } from '@app/common/language-model/language-model.module';
import { VectorDbModule } from '@app/common/vectordb/vector-db-module';
import { Module } from '@nestjs/common';

import { GoogleWebSearchModule } from '../google-web-search/google-web-search.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatFileKeyRepository } from './models/chat-file-key.repository';
import { ChatMessageRepository } from './models/chat-message.repository';
import { ChatTopicRepository } from './models/chat-topic.repository';

@Module({
    imports: [LanguageModelModule, FileModule, VectorDbModule, GoogleWebSearchModule],
    controllers: [ChatController],
    providers: [ChatService, ChatMessageRepository, ChatTopicRepository, ChatFileKeyRepository],
})
export class ChatModule {}
