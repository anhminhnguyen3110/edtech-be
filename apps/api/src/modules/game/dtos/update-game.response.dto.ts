import { PartialType } from '@nestjs/swagger';

import { GetGameResponseDto } from './get-game-response.dto';

export class UpdateGameResponseDto extends PartialType(GetGameResponseDto) {}
