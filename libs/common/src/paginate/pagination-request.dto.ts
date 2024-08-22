import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsPositive } from 'class-validator';

import { ESortDirection } from '../constants/database.constant';

export class PaginationRequestDto {
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsPositive()
    @ApiPropertyOptional({
        type: 'number',
        example: 10,
    })
    limit?: number = 10;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsPositive()
    @ApiPropertyOptional({
        required: false,
        type: 'number',
        example: 1,
    })
    page?: number = 1;

    @IsOptional()
    @ApiPropertyOptional({
        required: false,
        type: 'string',
    })
    sortBy?: string;

    @IsOptional()
    @ApiPropertyOptional({
        required: false,
        type: 'enum',
        enum: ESortDirection,
    })
    @IsEnum(ESortDirection)
    sortDirection?: ESortDirection;
}
