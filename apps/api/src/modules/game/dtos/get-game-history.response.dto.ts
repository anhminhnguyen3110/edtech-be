import { EGameStatus, EQuestionType } from '@app/common/constants/table.constant';
import { ApiResponseProperty, PartialType } from '@nestjs/swagger';

export class GetPlayersAnswerGameHistoryResponseDto {
    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    playerId: number;

    @ApiResponseProperty({
        type: String,
        example: 'Player1',
    })
    nickname: string;

    @ApiResponseProperty({
        type: Number,
        example: 6,
    })
    numberOfCorrectAnswers: number;

    @ApiResponseProperty({
        type: Number,
        example: 2,
    })
    numberOfUnansweredQuestions: number;

    @ApiResponseProperty({
        type: Number,
        example: 2,
    })
    numberOfWrongAnswers: number;

    @ApiResponseProperty({
        type: Number,
        example: 4,
    })
    longestStrikeCount: number;

    @ApiResponseProperty({
        type: Number,
        example: 6350,
    })
    finalScore: number;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    finalRank: number;
}

export class GetQuestionsGameHistoryResponseDto {
    @ApiResponseProperty({
        type: Number,
        example: 51,
    })
    questionId: number;

    @ApiResponseProperty({
        type: Number,
        example: 6,
    })
    numberOfCorrectAnswers: number;

    @ApiResponseProperty({
        type: String,
        example: 'A well-structured essay should directly address the given prompt.',
    })
    questionText: string;

    @ApiResponseProperty({
        type: String,
        example: 'TRUE_FALSE',
    })
    questionType: string;

    @ApiResponseProperty({
        type: Number,
        example: 2,
    })
    totalPlayers: number;
}

export class GetPlayersAnswerForSingleQuestionGameHistoryResponseDto {
    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    playerId: number;

    @ApiResponseProperty({
        type: String,
        example: 'Player1',
    })
    nickname: string;

    @ApiResponseProperty({
        type: [String],
        example: ['True'],
    })
    playerAnswer: string[];

    @ApiResponseProperty({
        type: Boolean,
        example: true,
    })
    isCorrect: boolean;

    @ApiResponseProperty({
        type: Number,
        example: 1000,
    })
    scoresGained: number;

    @ApiResponseProperty({
        type: Number,
        example: 30,
    })
    timeSubmittedInSecond: number;
}

export class GetQuestionsWithDetailsGameHistoryResponseDto extends PartialType(
    GetQuestionsGameHistoryResponseDto,
) {
    @ApiResponseProperty({
        type: [String],
        example: ['True', 'False'],
    })
    choices: string[];

    @ApiResponseProperty({
        type: [String],
        example: ['True'],
    })
    correctAnswer: string[];

    @ApiResponseProperty({
        type: Number,
        example: 30,
    })
    numberOfWrongAnswers: number;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    numberOfUnansweredQuestions: number;

    @ApiResponseProperty({
        type: Number,
        example: 3,
    })
    averageResponseTime: number;

    @ApiResponseProperty({
        type: Number,
        example: 6,
    })
    maxResponseTime: number;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    minResponseTime: number;

    @ApiResponseProperty({
        type: String,
        example: null,
    })
    imageUrl: string;

    @ApiResponseProperty({
        type: Number,
        example: 30,
    })
    timeLimitInSecond: number;

    players: GetPlayersAnswerForSingleQuestionGameHistoryResponseDto[];
}

export class GetQuestionsPerformanceForSinglePlayerGameHistoryResponseDto {
    @ApiResponseProperty({
        type: Number,
        example: 0,
    })
    scoresGained: number;

    @ApiResponseProperty({
        type: Number,
        example: 0,
    })
    currentScore: number;

    @ApiResponseProperty({
        type: Number,
        example: 0,
    })
    currentStrikeCount: number;

    @ApiResponseProperty({
        type: Number,
        example: 0,
    })
    currentNumberOfCorrectAnswers: number;

    @ApiResponseProperty({
        type: Number,
        example: 7,
    })
    currentRank: number;

    @ApiResponseProperty({
        type: Boolean,
        example: false,
    })
    isCorrect: boolean;

    @ApiResponseProperty({
        type: Number,
        example: 10,
    })
    timeSubmittedInSecond: number;

    @ApiResponseProperty({
        type: Number,
        example: 51,
    })
    questionId: number;

    @ApiResponseProperty({
        type: String,
        example: 'A well-structured essay should directly address the given prompt.',
    })
    questionText: string;

    @ApiResponseProperty({
        type: 'enum',
        enum: EQuestionType,
        example: EQuestionType.TRUE_FALSE,
    })
    questionType: EQuestionType;

    @ApiResponseProperty({
        type: Number,
        example: 30,
    })
    timeLimitInSecond: number;
}

export class GetPlayersAnswerWithDetailsGameHistoryResponseDto extends PartialType(
    GetPlayersAnswerGameHistoryResponseDto,
) {
    questionsPerformance: GetQuestionsPerformanceForSinglePlayerGameHistoryResponseDto[];
}

export class GetGameDetailsResponseDto {
    @ApiResponseProperty({
        type: Number,
        example: 24,
    })
    id: number;

    @ApiResponseProperty({
        type: String,
        example: new Date().toISOString(),
    })
    startedAt: string;

    @ApiResponseProperty({
        type: String,
        example: new Date().toISOString(),
    })
    endedAt: string;

    @ApiResponseProperty({
        type: String,
        example: '242814',
    })
    gameCode: string;

    @ApiResponseProperty({
        type: 'enum',
        enum: EGameStatus,
        example: EGameStatus.COMPLETED,
    })
    gameStatus: EGameStatus;

    @ApiResponseProperty({
        type: Number,
        example: 2,
    })
    quizId: number;

    @ApiResponseProperty({
        type: String,
        example: 'Quiz 1',
    })
    quizName: string;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    quizClassAssignmentId: number;

    @ApiResponseProperty({
        type: Number,
        example: 10,
    })
    totalQuestions: number;
}

export class GetGameHistoryDetailsResponseDto {
    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    totalPlayers: number;

    game: GetGameDetailsResponseDto;

    players: GetPlayersAnswerGameHistoryResponseDto[];

    questions: GetQuestionsGameHistoryResponseDto[];
}

export class GetPlayerPerformanceResponseDto {
    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    playerId: number;

    @ApiResponseProperty({
        type: String,
        example: 'Player1',
    })
    nickname: string;

    @ApiResponseProperty({
        type: Number,
        example: 6,
    })
    totalGames: number;
}

export class GetGameHistoryPerformanceResponseDto {
    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    gameId: number;

    @ApiResponseProperty({
        type: String,
        example: '242814',
    })
    gameCode: string;

    @ApiResponseProperty({
        type: String,
        example: new Date().toISOString(),
    })
    startedAt: string;

    @ApiResponseProperty({
        type: String,
        example: new Date().toISOString(),
    })
    endedAt: string;

    @ApiResponseProperty({
        type: 'enum',
        enum: EGameStatus,
        example: EGameStatus.COMPLETED,
    })
    gameStatus: EGameStatus;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    quizName: string;
}

export class GetPerformanceDetailResponseDto {
    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    quizName: string;

    @ApiResponseProperty({
        type: String,
        example: 'Player1',
    })
    nickname: string;

    @ApiResponseProperty({
        type: String,
        example: new Date().toISOString(),
    })
    startedAt: string;

    @ApiResponseProperty({
        type: String,
        example: new Date().toISOString(),
    })
    endedAt: string;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    playerScore: number;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    personalScore: number;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    finalRank: number;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    totalPlayers: number;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    totalQuestions: number;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    numberOfCorrectAnswers: number;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    averageResponseTimePerQuestion: number;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    averageClassResponseTimePerQuestion: number;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    longestStrikeCount: number;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    gameId: number;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    highestScoreInGame: number;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    lowestScoreInGame: number;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    averageScoreInGame: number;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    longestStrikeCountInGame: number;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    averageResponseTimePerQuestionInGame: number;
}
