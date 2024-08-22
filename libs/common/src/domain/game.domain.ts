import { EGameStatus } from '../constants/table.constant';

export class Game {
    id: number;
    quizId: number;
    status: EGameStatus;
    createdAt: Date;
    updatedAt: Date;
}
