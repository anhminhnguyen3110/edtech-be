import { FileModule } from '@app/common/file/file.module';
import { LanguageModelModule } from '@app/common/language-model/language-model.module';
import { FileDeletionModule } from '@app/common/utils/file-remove.module';
import { Module } from '@nestjs/common';

import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
    imports: [LanguageModelModule, FileDeletionModule, FileModule],
    controllers: [ChatController],
    providers: [ChatService],
})
export class ChatModule {}
