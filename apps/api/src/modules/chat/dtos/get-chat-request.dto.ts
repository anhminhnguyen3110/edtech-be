import { EVectorDbIndex } from '@app/common/constants/vector-db.constant';
import { PaginationRequestDto } from '@app/common/paginate/pagination-request.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class GetChatTopicRequestDto extends PaginationRequestDto {}

export class GetChatMessageRequestDto extends PaginationRequestDto {}

export class GetDocumentFromVectorDbRequestDto {
    @ApiPropertyOptional({
        type: String,
        description: 'The query to search for',
        example: '*',
    })
    @IsOptional()
    @IsString()
    query?: string = '*';

    @ApiPropertyOptional({
        type: Number,
        example: 5,
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    top?: number = 5;

    @ApiPropertyOptional({
        type: Number,
        description: 'The topic id to search for',
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    chatTopicId: number;

    @ApiPropertyOptional({
        type: 'enum',
        enum: EVectorDbIndex,
        description: 'The index to search in',
        example: EVectorDbIndex.USER_DOCUMENT,
    })
    @IsOptional()
    @IsEnum(EVectorDbIndex)
    index: EVectorDbIndex = EVectorDbIndex.USER_DOCUMENT;

    @ApiPropertyOptional({
        type: Boolean,
        description: 'Whether to use semantic search',
        example: true,
    })
    @Transform(({ value }) => value === 'true')
    @IsOptional()
    @IsBoolean()
    isSemantic = true;
}
