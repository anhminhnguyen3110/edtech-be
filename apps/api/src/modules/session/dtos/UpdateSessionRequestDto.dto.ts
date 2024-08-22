import { PickType } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

import { CreateSessionRequestDto } from './CreateSessionRequestDto.dto';

export class UpdateSessionRequestDto extends PickType(CreateSessionRequestDto, ['randomHash']) {
    @IsNotEmpty()
    id: number;
}
