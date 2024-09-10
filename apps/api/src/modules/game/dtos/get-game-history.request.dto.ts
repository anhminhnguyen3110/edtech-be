import { PaginationRequestDto } from '@app/common/paginate/pagination-request.dto';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class GetPlayerPerformanceRequestDto extends PartialType(PaginationRequestDto) {
    @ApiPropertyOptional({
        type: String,
        description: 'Search player name',
    })
    @IsOptional()
    @IsString()
    searchPlayerName?: string;
}

export class GetGamesPerformanceRequestDto {
    @ApiProperty({
        type: String,
        description: 'Search game by player name',
    })
    @IsString()
    @IsNotEmpty()
    playerNickname: string;
}

export class PlayerGameRequestDto {
    @ApiProperty({
        type: String,
        description: 'Search game by player name',
        example: 'player1',
    })
    @IsString()
    @IsNotEmpty()
    playerNickname: string;

    @ApiProperty({
        type: Number,
        description: 'Search game by game name',
        example: 1,
    })
    gameId: number;
}

export class GetPerformanceDetailRequestDto {
    @ApiProperty({
        type: [PlayerGameRequestDto],
        description: 'Search game by player name',
        example: [
            { playerNickname: 'player1', gameId: 2 },
            { playerNickname: 'player2', gameId: 3 },
            { playerNickname: 'player3', gameId: 4 },
        ],
    })
    playerGameRequest: PlayerGameRequestDto[];
}

export class GetPerformanceDetailInsightRequestDto {
    @ApiProperty({
        type: String,
        description: 'Name of the quiz',
        example: 'Quiz1',
    })
    @IsString()
    @IsNotEmpty()
    quizName: string;

    @ApiProperty({
        type: String,
        description: 'Player nickname',
        example: 'Player1',
    })
    @IsString()
    @IsNotEmpty()
    nickname: string;

    @ApiProperty({
        type: String,
        description: 'Start time of the quiz in ISO format',
        example: new Date().toISOString(),
    })
    @IsDateString()
    @IsNotEmpty()
    startedAt: string;

    @ApiProperty({
        type: String,
        description: 'End time of the quiz in ISO format',
        example: new Date().toISOString(),
    })
    @IsDateString()
    @IsNotEmpty()
    endedAt: string;

    @ApiProperty({
        type: Number,
        description: 'Score achieved by the player',
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    playerScore: number;

    @ApiProperty({
        type: Number,
        description: "Player's personal highest score",
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    personalScore: number;

    @ApiProperty({
        type: Number,
        description: 'Final rank of the player',
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    finalRank: number;

    @ApiProperty({
        type: Number,
        description: 'Total number of players in the game',
        example: 1,
    })
    @IsNumber()
    @IsNotEmpty()
    totalPlayers: number;

    @ApiProperty({
        type: Number,
        description: 'Total number of questions in the quiz',
        example: 10,
    })
    @IsNumber()
    @IsNotEmpty()
    totalQuestions: number;

    @ApiProperty({
        type: Number,
        description: 'Number of correct answers by the player',
        example: 8,
    })
    @IsNumber()
    @IsNotEmpty()
    numberOfCorrectAnswers: number;

    @ApiProperty({
        type: Number,
        description: 'Average response time per question by the player in seconds',
        example: 5,
    })
    @IsNumber()
    @IsNotEmpty()
    averageResponseTimePerQuestion: number;

    @ApiProperty({
        type: Number,
        description: 'Average response time per question for the entire class in seconds',
        example: 6,
    })
    @IsNumber()
    @IsNotEmpty()
    averageClassResponseTimePerQuestion: number;

    @ApiProperty({
        type: Number,
        description: "Player's longest correct answer streak",
        example: 3,
    })
    @IsNumber()
    @IsNotEmpty()
    longestStrikeCount: number;

    @ApiProperty({
        type: Number,
        description: 'ID of the game',
        example: 123,
    })
    @IsNumber()
    @IsNotEmpty()
    gameId: number;

    @ApiProperty({
        type: Number,
        description: 'Highest score achieved in the game',
        example: 9,
    })
    @IsNumber()
    @IsNotEmpty()
    highestScoreInGame: number;

    @ApiProperty({
        type: Number,
        description: 'Lowest score achieved in the game',
        example: 2,
    })
    @IsNumber()
    @IsNotEmpty()
    lowestScoreInGame: number;

    @ApiProperty({
        type: Number,
        description: 'Average score in the game',
        example: 5,
    })
    @IsNumber()
    @IsNotEmpty()
    averageScoreInGame: number;

    @ApiProperty({
        type: Number,
        description: 'Longest strike count in the game by any player',
        example: 4,
    })
    @IsNumber()
    @IsNotEmpty()
    longestStrikeCountInGame: number;
}

export class GetPerformanceInsightRequestDto {
    @ApiProperty({
        type: [GetPerformanceDetailInsightRequestDto],
        description: 'List of performance insights',
    })
    performanceDetailInsightRequest: GetPerformanceDetailInsightRequestDto[];
}
