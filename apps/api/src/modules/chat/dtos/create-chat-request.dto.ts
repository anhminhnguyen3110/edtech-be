import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateChatRequestDto {
    @ApiProperty({
        type: String,
        description: 'Messages prompt from user',
        example: 'Hello, how are you?',
    })
    @IsNotEmpty()
    @IsString()
    @MaxLength(10000)
    message: string;

    @ApiPropertyOptional({
        type: Number,
        description: 'Chat topic id',
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    topicId?: number;

    @ApiPropertyOptional({
        type: 'string',
        format: 'binary',
        name: 'document',
    })
    @IsOptional()
    file: any;
}
