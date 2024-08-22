import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateChatRequestDto {
    @ApiProperty({
        type: String,
        example: 'Hello, how are you?',
    })
    @IsNotEmpty()
    @IsString()
    topicName: string;
}
