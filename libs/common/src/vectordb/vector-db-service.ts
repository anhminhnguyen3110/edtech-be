import { ELoggerService } from '@app/common/constants/service.constant';
import { EVectorDbIndex } from '@app/common/constants/vector-db.constant';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { v4 as uuid } from 'uuid';

import { ECommonConfig } from '../config/interfaces/config.interface';
import {
    UserDocumentUploadInternalDto,
    UserDocumentUploadRequestDto,
    VectorDbSearchRequestDto,
} from './dtos/vector-db-request.dto';
import { EduDocumentResponseDto, UserDocumentResponseDto } from './dtos/vector-db-response-dto';

type TPDFPage = {
    pageContent: string;
    metadata: {
        loc: { pageNumber: number };
    };
};

@Injectable()
export class VectorDbService {
    private readonly vectorDbEndpoint;
    private readonly vectorDbApiKey;
    private readonly vectorDbApiVersion;
    private readonly headers;
    private batchSize = 100;
    constructor(
        private readonly configService: ConfigService,
        @Inject(ELoggerService.LOGGER_KEY) private readonly logger: ILogger,
    ) {
        this.vectorDbEndpoint = this.configService.get<string>(ECommonConfig.VECTOR_DB_ENDPOINT);
        this.vectorDbApiKey = this.configService.get<string>(ECommonConfig.VECTOR_DB_API_KEY);
        this.vectorDbApiVersion = this.configService.get<string>(
            ECommonConfig.VECTOR_DB_API_VERSION,
        );
        this.headers = {
            'Content-Type': 'application/json',
            'api-key': this.vectorDbApiKey,
        };
    }

    async uploadDocument(indexName: EVectorDbIndex, documents: any[]): Promise<void> {
        let response;
        const upsertUrl = `${
            this.vectorDbEndpoint
        }/indexes/${indexName.toString()}/docs/index?api-version=${this.vectorDbApiVersion}`;

        try {
            response = await axios.post(
                upsertUrl,
                {
                    value: documents,
                },
                {
                    headers: this.headers,
                },
            );
        } catch (error) {
            this.logger.error(error);
            throw error;
        }

        return response;
    }

    async uploadAndChunkDocument(index: EVectorDbIndex, dto: UserDocumentUploadInternalDto) {
        const pdfLoader = new PDFLoader(dto.stageFilePath);
        const pages: TPDFPage[] = (await pdfLoader.load()) as TPDFPage[];

        const chunks = (
            await Promise.all(
                pages.map(async page => {
                    return await this.prepareDocument(page);
                }),
            )
        ).flat();

        const batches = this.splitIntoBatches(chunks, this.batchSize);

        for (const batch of batches) {
            const uploadDtos: UserDocumentUploadRequestDto[] = batch.map(
                chunk =>
                    new UserDocumentUploadRequestDto({
                        docId: uuid(),
                        title: dto.title,
                        rawText: chunk,
                        chatTopicId: dto.chatTopicId,
                    }),
            );

            await this.uploadDocument(
                index,
                uploadDtos.map(dto => instanceToPlain<UserDocumentUploadRequestDto>(dto)),
            );
        }

        this.logger.info(`Uploading ${chunks.length} chunks to VectorDB`);
    }

    private splitIntoBatches<T>(array: T[], batchSize: number): T[][] {
        const batches: T[][] = [];
        for (let i = 0; i < array.length; i += batchSize) {
            batches.push(array.slice(i, i + batchSize));
        }
        return batches;
    }

    private async prepareDocument(page: TPDFPage): Promise<string[]> {
        let { pageContent } = page;

        pageContent = pageContent.replace(/\n/g, '');

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: this.configService.get<number>(ECommonConfig.CHUNK_SIZE),
            chunkOverlap: this.configService.get<number>(ECommonConfig.CHUNK_OVERLAP),
        });

        const chunks = await splitter.splitText(pageContent);

        return chunks;
    }

    async searchDocument(indexName: EVectorDbIndex, body: VectorDbSearchRequestDto): Promise<any> {
        const searchUrl = `${
            this.vectorDbEndpoint
        }/indexes/${indexName.toString()}/docs/search?api-version=${this.vectorDbApiVersion}`;

        let response: any;

        try {
            const axiosResponse = await axios.post(searchUrl, body, {
                headers: this.headers,
            });

            response = axiosResponse?.data?.value;
        } catch (error) {
            this.logger.error(error);
            throw error;
        }

        switch (indexName) {
            case EVectorDbIndex.USER_DOCUMENT:
                return response.map(doc => plainToInstance(UserDocumentResponseDto, doc));
            case EVectorDbIndex.EDUCATION:
                return response.map(doc => plainToInstance(EduDocumentResponseDto, doc));
            default:
                return response.map(doc => plainToInstance(UserDocumentResponseDto, doc));
        }
    }
}
