import { Expose, Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';

export class BaseDocumentResponseDto {
    @IsNumber()
    '@search.score': number;

    @IsString()
    id: string;

    @IsString()
    title: string;

    @IsString()
    document: string;
}

export class UserDocumentResponseDto extends BaseDocumentResponseDto {
    @Expose({ name: 'chat_topic_id' })
    @IsString()
    chatTopicId: string;
}

export class EduDocumentResponseDto extends BaseDocumentResponseDto {
    @IsString()
    url: string;
}

export class BaseSearchResponseDto {
    @IsString()
    '@odata.context': string;

    @IsNumber()
    '@odata.count': number;

    @IsArray()
    @ValidateNested({ each: true })
    value: BaseDocumentResponseDto[];
}

export class UserDocumentSearchResponseDto extends BaseSearchResponseDto {
    @Type(() => UserDocumentResponseDto)
    value: UserDocumentResponseDto[];
}

export class EduKnowledgeSearchResponseDto extends BaseSearchResponseDto {
    @Type(() => EduDocumentResponseDto)
    value: EduDocumentResponseDto[];
}
