import { ENotificationEventType } from '@app/common/constants/ws.constant';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateNotificationRequestDto {
    @ApiProperty({
        type: String,
        example: 'New message',
        description: 'Message',
    })
    @IsNotEmpty()
    @IsString()
    message: string;

    @ApiPropertyOptional({
        type: Number,
        example: 1,
        description: 'Class assignment ID',
    })
    @IsOptional()
    @IsInt()
    classAssignmentId?: number;

    @ApiProperty({
        type: 'enum',
        enum: ENotificationEventType,
    })
    eventType: ENotificationEventType;
}
