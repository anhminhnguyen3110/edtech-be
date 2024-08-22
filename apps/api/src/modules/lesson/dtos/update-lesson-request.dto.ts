import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateLessonRequestDto {
    @ApiProperty({
        type: String,
        description: 'The name of the lesson',
        example: 'Mathematics',
    })
    @IsNotEmpty()
    @IsString()
    name: string;
}
