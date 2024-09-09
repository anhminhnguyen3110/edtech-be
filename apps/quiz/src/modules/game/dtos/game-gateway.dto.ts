import { EGameStatus } from '@app/common/constants/table.constant';
import { PartialType } from '@nestjs/swagger';
import { GetQuestionResponseDto } from 'apps/api/src/modules/question/dtos/get-question-response.dto';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsDate,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsString,
    Min,
} from 'class-validator';

export class WsHostJoinRequestDto {
    @IsString()
    @IsNotEmpty()
    gameCode: string;
}

export class WsPlayerJoinRequestDto {
    @IsString()
    @IsNotEmpty()
    gameCode: string;

    @IsString()
    @IsNotEmpty()
    nickname: string;
}

export class WsPlayerJoinResponseDto {
    nickname: string;
    gameCode: string;
    playerId: number;
}

export class WsHostStartGameRequestDto {
    @IsString()
    @IsNotEmpty()
    gameCode: string;
}

export class WsAnswerSubmittedRequestDto {
    @IsArray()
    @IsNotEmpty()
    answer: string[];

    @IsInt()
    @Min(0)
    questionIndexInQuiz: number;

    @IsString()
    @IsNotEmpty()
    gameCode: string;

    @IsDate()
    @Type(() => Date)
    timeSubmitted: Date = new Date();

    @IsInt()
    timeZoneOffset: number = new Date().getTimezoneOffset();
}

export class WsUpdatePlayersInLobbyDto {
    players: any[];
    playersCount: number;
}

export class WsUpdatePlayersAnsweredDto {
    players: any[];
}

export class WsUpdateRankingDto {
    rankedPlayers: any[];
}

export class WsQuestionHostResultDto {
    correctAnswer: string[];
    questionIndexInQuiz: number;
    questionStatistic: any;
}

export class WsQuestionPlayerResultDto {
    playerId: number;
    isCorrect: boolean;
    pointAwarded: number;
    strikeCount: number;
    timeSubmitted: Date;
    currentScore: number;
    rank: number;
    timeSpent: number;
}

export class WsQuizRankResponseDto {
    playerId: number;
    playerNickname: string;
    playerScore: number;
    playerRank: number;
}

export class WsHostGetQuestionRequestDto {
    @IsString()
    @IsNotEmpty()
    gameCode: string;

    @IsInt()
    @IsNotEmpty()
    @Min(0)
    questionIndexInQuiz: number;

    @IsInt()
    @IsNotEmpty()
    @Min(5)
    delayTimeInSeconds: number;
}

export class WsHostProceedToNextQuestionRequestDto {
    @IsString()
    @IsNotEmpty()
    gameCode: string;

    @IsInt()
    @Min(0)
    questionIndexInQuiz: number;
}

export class WsHostProceedToNextQuestionResponseDto {
    questionIndexInQuiz: number;
    message: string;
}

export class WsHostEndGameRequestDto {
    @IsString()
    @IsNotEmpty()
    gameCode: string;

    @IsInt()
    @Min(0)
    questionIndexInQuiz: number;
}

export class WsGetQuestionResponseDto extends PartialType(GetQuestionResponseDto) {
    timeQuestionStart: string;
}

export class WsAnswerSubmittedResponseDto {
    playerId: number;
    submittedTime: Date;
}

export class GetClientResponseDto {
    gameCode: string;
    role: string;
}

export class UpdateGameStatusRequestDto {
    @IsNotEmpty()
    @IsNumber()
    gameId: number;

    @IsNotEmpty()
    @IsEnum(EGameStatus)
    status: EGameStatus;
}
