import { EGameStatus } from '@app/common/constants/table.constant';
import { ApiResponseProperty } from '@nestjs/swagger';

export class CreateGameResponseDto {
    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    id: number;

    @ApiResponseProperty({
        type: String,
        example: '123123123',
    })
    gameCode: string;

    @ApiResponseProperty({
        type: 'enum',
        enum: EGameStatus,
        example: EGameStatus.ACTIVE,
    })
    status: EGameStatus = EGameStatus.ACTIVE;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    quizId: number;

    @ApiResponseProperty({
        type: String,
        example: 'Quiz Name',
    })
    quizName: string;

    @ApiResponseProperty({
        type: Number,
        example: 1,
    })
    noQuestions: number;
}
