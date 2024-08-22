import { PartialType } from '@nestjs/swagger';

import { CreateGameResponseDto } from './create-game-response.dto';

// export class GetGameResponseDto extends UnPickType {}
export class GetGameResponseDto extends PartialType(CreateGameResponseDto) {}
