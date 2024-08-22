import { EMailStatus } from '@app/common/constants/table.constant';
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';

import { CreateMailRequestDto } from './create-mail-request.dto';

export class UpdateMailRequestDto extends OmitType(CreateMailRequestDto, ['to']) {
    @ApiProperty({
        description: 'The id of the mail to update',
        example: 1,
        type: Number, // Explicitly setting the type as Number
    })
    @IsNotEmpty()
    @IsInt()
    id: number;

    @ApiProperty({
        type: 'enum',
        description: 'The status of the mail',
        example: EMailStatus.PENDING,
        enum: EMailStatus,
    })
    @IsNotEmpty()
    @IsEnum(EMailStatus)
    status: EMailStatus;
}
