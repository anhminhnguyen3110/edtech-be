import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateNotificationRequestDto {
    @ApiProperty({
        type: Boolean,
        example: true,
        description: 'Is read',
    })
    @IsNotEmpty()
    @IsBoolean()
    isRead: boolean;
}
