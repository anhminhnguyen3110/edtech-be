import { Module } from '@nestjs/common';

import { EChatService } from '../constants/service.constant';
import { AzureGptModelService } from './external-service/azure.service';
import { LanguageModelService } from './language-model.service';

@Module({
    providers: [
        {
            provide: EChatService.BASE_CHAT_SERVICE,
            useClass: AzureGptModelService,
        },
        {
            provide: EChatService.CHAT_SERVICE,
            useClass: LanguageModelService,
        },
    ],
    exports: [EChatService.CHAT_SERVICE],
})
export class LanguageModelModule {}
