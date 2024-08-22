import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, Min } from 'class-validator';

import { PaginationRequestDto } from './pagination-request.dto';

class PaginationMeta {
    @ApiProperty({ description: 'Current page number' })
    @IsInt()
    @Min(1)
    currentPage: number;

    @ApiProperty({
        description: 'Number of items in the current page',
    })
    @IsInt()
    @IsPositive()
    itemCount: number;

    @ApiProperty({
        description: 'Number of items per page',
    })
    @IsInt()
    @IsPositive()
    itemsPerPage: number;

    @ApiProperty({ description: 'Total number of items' })
    @IsInt()
    @IsPositive()
    totalItems: number;

    @ApiProperty({ description: 'Total number of pages' })
    @IsInt()
    @IsPositive()
    totalPages: number;
}

export class PaginationResponseDto<T> {
    @ApiProperty({
        description: 'List of items',
        isArray: true,
    })
    items: T[];

    @ApiProperty({ description: 'Pagination metadata' })
    meta: PaginationMeta;

    constructor(items: T[], paginationRequestDto: PaginationRequestDto, total: number) {
        const totalItem = total;
        this.items = items;

        this.meta = {
            currentPage: paginationRequestDto.page,
            itemCount: items.length, // This can be different from limit when the last page is reached
            itemsPerPage: paginationRequestDto.limit,
            totalItems: totalItem,
            totalPages: Math.ceil(totalItem / paginationRequestDto.limit),
        };
    }
}
