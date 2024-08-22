import { ECommonConfig } from '@app/common/config/interfaces/config.interface';
import { ELoggerService } from '@app/common/constants/service.constant';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { plainToInstance } from 'class-transformer';

import { GoogleWebSearchResponseDto } from './dtos/google-web-search.dto';

@Injectable()
export class GoogleWebSearchService {
    private readonly googleWebSearchEndpoint;
    private readonly googleWebSearchApiKey;

    constructor(
        @Inject(ELoggerService.LOGGER_KEY) private readonly loggerService,
        private readonly configService: ConfigService,
    ) {
        this.googleWebSearchEndpoint = this.configService.get<string>(
            ECommonConfig.GOOGLE_WEB_SEARCH_ENDPOINT,
        );
        this.googleWebSearchApiKey = this.configService.get<string>(
            ECommonConfig.GOOGLE_WEB_SEARCH_API_KEY,
        );
    }

    async search(query: string): Promise<GoogleWebSearchResponseDto> {
        const payload = {
            api_key: this.googleWebSearchApiKey,
            query: query,
            max_results: 5,
            include_answer: true,
        };

        const response = await axios.post(this.googleWebSearchEndpoint, payload);

        const result: GoogleWebSearchResponseDto = plainToInstance(
            GoogleWebSearchResponseDto,
            response.data,
        );
        return result;
    }
}
