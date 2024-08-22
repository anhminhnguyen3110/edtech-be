import { EMailStatus, EMailType } from '@app/common/constants/table.constant';
import { ApiResponseProperty } from '@nestjs/swagger';

export class CreateMailResponseDto {
    @ApiResponseProperty({
        example: 1,
        type: Number,
    })
    id: number;

    @ApiResponseProperty({
        example: 'sender@example.com',
        type: String,
    })
    from: string;

    @ApiResponseProperty({
        example: 'receiver@example.com',
        type: String,
    })
    to: string;

    @ApiResponseProperty({
        example: 'Your weekly newsletter!',
        type: String,
    })
    subject: string;

    @ApiResponseProperty({
        example: 'Hello, this is your requested newsletter...',
        type: String,
    })
    body: string;

    @ApiResponseProperty({
        example: EMailType.ACCOUNT_ACTIVATION,
        type: 'enum',
        enum: EMailType,
    })
    type: EMailType;

    @ApiResponseProperty({
        example: EMailStatus.SENT,
        type: 'enum',
        enum: EMailStatus,
    })
    status: EMailStatus;
}
