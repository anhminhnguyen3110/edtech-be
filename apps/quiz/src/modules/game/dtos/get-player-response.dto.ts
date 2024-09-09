import { ApiResponseProperty, OmitType } from '@nestjs/swagger';

export class GetPlayerResponseDto {
    @ApiResponseProperty({
        type: String,
        example: 'TxZWHz6XC75ejiBqAAAB',
    })
    clientRedisId: string;

    @ApiResponseProperty({
        type: String,
        example: '123123',
    })
    gameCode: string;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    playerId: number;

    @ApiResponseProperty({
        type: String,
        example: 'John Doe',
    })
    nickname: string;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    score: number;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    strikeCount: number;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    numberOfCorrectAnswers: number;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    rank: number;

    @ApiResponseProperty({
        type: Object,
        example: {
            questionIndexInQuiz: 1,
            answer: ['A', 'B'],
            timeSubmitted: new Date().toISOString(),
            pointAwarded: 1,
            isCorrect: true,
        },
    })
    recentAnswerQuestion?: {
        questionIndexInQuiz: number;
        playerAnswer: string[];
        timeSubmitted: Date;
        timeSpent: number;
        pointAwarded: number;
        isCorrect: boolean;
    };
}

export class GetPlayersAnswerResponseDto extends OmitType(GetPlayerResponseDto, [
    'clientRedisId',
    'recentAnswerQuestion',
]) {
    @ApiResponseProperty({
        type: [String],
        example: ['A', 'B'],
    })
    playerAnswer: string[];

    @ApiResponseProperty({
        type: Boolean,
        example: true,
    })
    isCorrect: boolean;

    @ApiResponseProperty({
        type: Date,
        example: new Date().toISOString(),
    })
    timeSubmitted: Date;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    timeSpent: number;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    questionIndexInQuiz: number;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    pointAwarded: number;
}
