import { IsNotEmpty } from 'class-validator';

import { GetPlayersAnswerResponseDto } from '../../game/dtos/get-player-response.dto';

export class CreateGameHistoryRequestDto {
    @IsNotEmpty()
    gameId: number;

    @IsNotEmpty()
    questionId: number;

    playersAnswered: GetPlayersAnswerResponseDto[];
}
