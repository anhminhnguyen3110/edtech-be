import {
    EduDocumentResponseDto,
    UserDocumentResponseDto,
} from '@app/common/vectordb/dtos/vector-db-response-dto';
import { ApiResponseProperty } from '@nestjs/swagger';
import { BaseDocumentResponseAdapterGoogleWebSearchDto } from 'apps/chat/src/modules/google-web-search/dtos/google-web-search.dto';

export class CreateChatResponseDto {
    @ApiResponseProperty({ example: 5 })
    chatTopicId: number;

    @ApiResponseProperty({
        example:
            "Can you provide a summary of the major deliverables and activities outlined in the 'Major Deliverables/Activities Timeline' document?",
    })
    nonArbitraryQuery: string;

    @ApiResponseProperty({
        example: [
            "Can you provide a summary of the major deliverables and activities outlined in the 'Major Deliverables/Activities Timeline' document?",
            "What are the major deliverables in the 'Major Deliverables/Activities Timeline' document?",
            "What activities are outlined in the 'Major Deliverables/Activities Timeline' document?",
            "Can you provide details on the weekly project work mentioned in the 'Major Deliverables/Activities Timeline'?",
            "What is the schedule for the system development in the 'Major Deliverables/Activities Timeline'?",
        ],
    })
    similarQueries: string[];

    @ApiResponseProperty({
        example: `Sure! Here is a summary of the major deliverables and activities outlined in the "Major Deliverables/Activities Timeline" document:`,
    })
    answer: string;

    @ApiResponseProperty({ example: 'false' })
    isUsedWebSearch: string;

    @ApiResponseProperty({ example: 'signed-url-example' })
    fileSignedUrl: string;

    @ApiResponseProperty({
        type: [UserDocumentResponseDto],
        example: [
            {
                '@search.score': 5.9036894,
                '@search.rerankerScore': 1.7173329591751099,
                id: 'ca00f761-2495-405a-b6f1-444a9ae896ef',
                document: 'Major Deliverables/Activities Timeline: indicative due dates Note',
                title: 'Major_Deliverables_Activities_Timeline.pdf',
                chatTopicId: 'b5529db5-df32-43e8-901d-d0b8e47e2d11',
            },
        ],
    })
    retrievedUserDocuments: UserDocumentResponseDto[];

    @ApiResponseProperty({
        type: [EduDocumentResponseDto],
        example: [
            {
                '@search.score': 5.9036894,
                '@search.rerankerScore': 1.7173329591751099,
                id: 'ca00f761-2495-405a-b6f1-444a9ae896ef',
                document: 'Educational document content example',
                title: 'Educational Document Example',
                url: 'https://example.com/educational-document',
            },
        ],
    })
    retrievedEduDocuments: EduDocumentResponseDto[];

    @ApiResponseProperty({
        type: [BaseDocumentResponseAdapterGoogleWebSearchDto],
        example: [
            {
                '@search.score': 5.9036894,
                '@search.rerankerScore': 1.7173329591751099,
                id: 'ca00f761-2495-405a-b6f1-444a9ae896ef',
                document: 'Web document content example',
                title: 'Web Document Example',
                url: 'https://example.com/web-document',
            },
        ],
    })
    retrievedWebDocuments: BaseDocumentResponseAdapterGoogleWebSearchDto[];

    @ApiResponseProperty({ example: 'topic-name-example' })
    topicName: string;

    @ApiResponseProperty({
        example: 'example.pdf',
    })
    fileName: string;
}
