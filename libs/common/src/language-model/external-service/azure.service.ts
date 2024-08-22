import { ECommonConfig } from '@app/common/config/interfaces/config.interface';
import { IChatPayload } from '@app/common/constants/chat.constant';
import { ELoggerService } from '@app/common/constants/service.constant';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import { AzureKeyCredential, OpenAIClient } from '@azure/openai';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LanguageModelAbstract } from '../language-model.abstract';
import { EModelDeployment } from '../language-model.interface';

@Injectable()
export class AzureGptModelService extends LanguageModelAbstract {
    private readonly gpt4vEndpoint: string;
    private readonly gpt4vKey: string;
    private readonly client: OpenAIClient;
    private readonly defaultDeployment: string;
    constructor(
        private configService: ConfigService,
        @Inject(ELoggerService.LOGGER_KEY) private readonly logger: ILogger,
    ) {
        super();
        this.gpt4vEndpoint = this.configService.get<string>(ECommonConfig.GPT4V_ENDPOINT);
        this.gpt4vKey = this.configService.get<string>(ECommonConfig.GPT4V_KEY);
        this.client = new OpenAIClient(this.gpt4vEndpoint, new AzureKeyCredential(this.gpt4vKey));

        this.defaultDeployment = EModelDeployment.GPT4O;
    }

    async getCompletion(payload: IChatPayload, deployment?: EModelDeployment): Promise<string> {
        let response = null;
        try {
            response = await this.client.getChatCompletions(
                deployment ? deployment : this.defaultDeployment,
                [
                    ...payload.messages.map(message => {
                        return {
                            role: message.role,
                            content: message.content,
                        };
                    }),
                ],
                {
                    temperature: payload.temperature,
                },
            );
        } catch (error) {
            this.logger.error(error);
        }

        const choice = response?.choices[0];
        const responseMessage = choice?.message?.content;
        return responseMessage;
    }

    async sendMessageToModel(prompt: string, temperature?: number) {
        let response;
        try {
            response = await this.client.getChatCompletions(
                this.defaultDeployment,
                [
                    {
                        role: 'system',
                        content: prompt,
                    },
                ],
                {
                    temperature: temperature || 0.2,
                    responseFormat: {
                        type: 'json_object',
                    },
                },
            );
            return JSON.parse(response?.choices[0]?.message?.content || null) || null;
        } catch (error) {
            this.logger.error(error.message);
        }
    }
}
