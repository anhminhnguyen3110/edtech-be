import {
    EVectorDbSearchQueryType,
    EVectorDbSearchSematicConfiguration,
} from '@app/common/constants/vector-db.constant';
import { Expose } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UserDocumentUploadRequestDto {
    @Expose({ name: '@search.action' })
    @IsString()
    @IsNotEmpty()
    searchAction = 'mergeOrUpload';

    @Expose({ name: 'id' })
    @IsString()
    @IsNotEmpty()
    id: string;

    @Expose({ name: 'title' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @Expose({ name: 'document' })
    @IsString()
    @IsNotEmpty()
    document: string;

    @Expose({ name: 'chat_topic_id' })
    @IsString()
    @IsNotEmpty()
    chatTopicId: string;

    constructor(doc: { docId: string; title: string; rawText: string; chatTopicId: string }) {
        this.searchAction = 'mergeOrUpload';
        this.id = doc.docId;
        this.title = doc.title;
        this.document = doc.rawText;
        this.chatTopicId = doc.chatTopicId;
    }
}

export class UserDocumentUploadInternalDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    stageFilePath: string;

    @IsString()
    @IsNotEmpty()
    chatTopicId: string;

    constructor(doc: { title: string; stageFilePath: string; chatTopicId: string }) {
        this.title = doc.title;
        this.stageFilePath = doc.stageFilePath;
        this.chatTopicId = doc.chatTopicId;
    }
}

export class VectorDbSearchRequestDto {
    @IsString()
    @IsOptional()
    search = '*';

    @IsBoolean()
    @IsOptional()
    count = true;

    @IsString()
    @IsOptional()
    filter: string;

    @IsNumber()
    @IsOptional()
    top = 5;

    @Expose({ name: 'queryType' })
    queryType = EVectorDbSearchQueryType.SEMANTIC;

    @Expose({ name: 'semanticConfiguration' })
    semanticConfiguration = EVectorDbSearchSematicConfiguration.SEARCH_ON_DOCUMENT;

    constructor(data: {
        search: string;
        count: boolean;
        top?: number;
        filter?: string;
        isSemantic?: boolean;
    }) {
        this.search = data.search;
        this.count = data.count;
        this.filter = data.filter;
        this.top = data.top || 5;
        if (data.isSemantic !== true) {
            this.queryType = undefined;
            this.semanticConfiguration = undefined;
        }
    }
}
