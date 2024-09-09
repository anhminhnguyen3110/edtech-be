import { ApiResponseProperty, PartialType } from '@nestjs/swagger';
import { CreateGameResponseDto } from 'apps/api/src/modules/game/dtos/create-game-response.dto';
import { GetQuizDetailResponseDto } from 'apps/api/src/modules/quiz/dtos/get-quiz-response.dto';

import { GetPlayerResponseDto } from './get-player-response.dto';

export class ScoreBoardDto {
    @ApiResponseProperty({
        type: [Number],
        example: 1,
    })
    playerId: number[];

    @ApiResponseProperty({
        type: [Number],
        example: 1,
    })
    score: number[];

    @ApiResponseProperty({
        type: [Number],
        example: 1,
    })
    rank: number[];
}

export class GameRedisPayloadDto extends PartialType(CreateGameResponseDto) {
    @ApiResponseProperty({
        type: GetQuizDetailResponseDto,
    })
    quiz?: GetQuizDetailResponseDto;

    @ApiResponseProperty({
        type: [GetPlayerResponseDto],
    })
    players?: GetPlayerResponseDto[];

    @ApiResponseProperty({
        type: ScoreBoardDto,
    })
    scoreBoard?: ScoreBoardDto;

    @ApiResponseProperty({
        type: String,
        example: 'TxZWHz6XC75ejiBqAAAB',
    })
    hostClientId?: string;

    @ApiResponseProperty({
        type: String,
        example: '2021-06-07T06:00:00.000Z',
    })
    questionStartTime?: string;
}
