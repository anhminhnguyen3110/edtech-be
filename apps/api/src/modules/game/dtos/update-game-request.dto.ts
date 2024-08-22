import { EGameStatus } from '@app/common/constants/table.constant';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateGameRequestDto {
    @ApiProperty({
        type: 'enum',
        enum: EGameStatus,
        example: EGameStatus.ACTIVE,
        description: 'Game status',
    })
    gameStatus: EGameStatus;
}
