import { Inject, Injectable } from '@nestjs/common';

import { IChatPayload } from '../constants/chat.constant';
import { EChatService } from '../constants/service.constant';
import { LanguageModelAbstract } from './language-model.abstract';
import { EModelDeployment } from './language-model.interface';

@Injectable()
export class LanguageModelService extends LanguageModelAbstract {
    constructor(
        @Inject(EChatService.BASE_CHAT_SERVICE)
        private readonly chatService: LanguageModelAbstract,
    ) {
        super();
    }

    async getCompletion(payload: IChatPayload, deployment?: EModelDeployment) {
        return this.chatService.getCompletion(payload, deployment);
    }

    async sendMessageToModel(prompt: string, temperature?: number) {
        return this.chatService.sendMessageToModel(prompt, temperature);
    }
}
