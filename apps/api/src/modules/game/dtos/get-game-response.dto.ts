import { ApiResponseProperty, PartialType } from '@nestjs/swagger';

import { CreateGameResponseDto } from './create-game-response.dto';

// export class GetGameResponseDto extends UnPickType {}
export class GetGameResponseDto extends PartialType(CreateGameResponseDto) {
    @ApiResponseProperty({
        type: Date,
        example: new Date(),
    })
    startedAt: Date;
}
