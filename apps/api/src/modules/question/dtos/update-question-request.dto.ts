import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

import { CreateQuestionRequestDto } from './create-question-request.dto';

export class UpdateQuestionRequestDto extends PartialType(CreateQuestionRequestDto) {
    @ApiProperty({
        type: Boolean,
        example: false,
        default: false,
    })
    @Transform(({ value }) => value === 'true')
    updateImage = false;
}
