import { BaseDocumentResponseDto } from '@app/common/vectordb/dtos/vector-db-response-dto';
import { Expose } from 'class-transformer';

export class GoogleWebSearchResponseDto {
    @Expose({
        name: 'query',
    })
    query: string;

    @Expose({
        name: 'results',
    })
    results: GoogleWebSearchResultDto[];

    @Expose({
        name: 'answer',
    })
    answer: string;
}

export class GoogleWebSearchResultDto {
    @Expose({
        name: 'title',
    })
    title: string;

    @Expose({
        name: 'url',
    })
    url: string;

    @Expose({
        name: 'content',
    })
    content: string;
}

export class BaseDocumentResponseAdapterGoogleWebSearchDto extends BaseDocumentResponseDto {
    url: string;

    constructor(googleWebSearchResponseDto: GoogleWebSearchResultDto) {
        super();
        this.title = googleWebSearchResponseDto.title;
        this.document = googleWebSearchResponseDto.content;
        this.url = googleWebSearchResponseDto.url;
    }
}
