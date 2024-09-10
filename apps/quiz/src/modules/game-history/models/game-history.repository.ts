import { ETableName } from '@app/common/constants/table.constant';
import { BaseRepository } from '@app/common/database/base.repository';
import { Injectable } from '@nestjs/common';
import {
    GetGamesPerformanceRequestDto,
    GetPlayerPerformanceRequestDto,
    PlayerGameRequestDto,
} from 'apps/api/src/modules/game/dtos/get-game-history.request.dto';
import { DataSource } from 'typeorm';

import { GameHistoryEntity } from './game-history.entity';

@Injectable()
export class GameHistoryRepository extends BaseRepository<GameHistoryEntity> {
    constructor(private readonly dataSource: DataSource) {
        super(GameHistoryEntity, dataSource, ETableName.GAME_HISTORY);
    }

    async getQueryRunner() {
        return this.dataSource.createQueryRunner();
    }

    private getBaseGameQuery(gameId: number) {
        return this.createQb().where(`${this.alias}.gameId = :gameId`, { gameId });
    }

    getNoPlayersByGameIdQuery(gameId: number) {
        return this.getBaseGameQuery(gameId).select(
            `COUNT(DISTINCT ${this.alias}.playerId)`,
            'numberOfPlayers',
        );
    }

    getQuestionsByGameIdQuery(gameId: number) {
        return this.getBaseGameQuery(gameId)
            .select(`${this.alias}.questionId as questionId`)
            .addSelect(
                `SUM(CASE WHEN ${this.alias}.isCorrect = 1 THEN 1 ELSE 0 END)`,
                'numberOfCorrectAnswers',
            )
            .addSelect([`q.questionText as questionText`, `q.questionType as questionType`])
            .leftJoin('question', 'q', `${this.alias}.questionId = q.id`)
            .groupBy(`${this.alias}.questionId`);
    }

    getQuestionDetailByGameIdQuery(gameId: number, questionId: number) {
        return this.getBaseGameQuery(gameId)
            .select(`${this.alias}.questionId as questionId`)
            .addSelect([
                `SUM(CASE WHEN ${this.alias}.isCorrect = 1 THEN 1 ELSE 0 END) as numberOfCorrectAnswers`,
                `SUM(CASE WHEN ${this.alias}.isCorrect = 0 AND ${this.alias}.timeSubmitted IS NOT NULL THEN 1 ELSE 0 END) as numberOfWrongAnswers`,
                `SUM(CASE WHEN ${this.alias}.timeSubmitted IS NULL THEN 1 ELSE 0 END) as numberOfUnansweredQuestions`,
                `AVG(${this.alias}.timeSpent) as averageResponseTime`,
                `MAX(${this.alias}.timeSpent) as maxResponseTime`,
                `MIN(${this.alias}.timeSpent) as minResponseTime`,
            ])
            .addSelect([
                `q.questionText as questionText`,
                `q.questionType as questionType`,
                `q.timeLimitInSecond as timeLimitInSecond`,
                `q.correctAnswersInDatabase as correctAnswer`,
                `q.choicesInDatabase as choices`,
                `q.imageFormat as imageFormat`,
            ])
            .leftJoin('question', 'q', `${this.alias}.questionId = q.id`)
            .andWhere(`${this.alias}.questionId = :questionId`, { questionId });
    }

    getRankByGameIdAndPlayerIdQuery(gameId: number, playerId: number) {
        return this.getBaseGameQuery(gameId)
            .select(`${this.alias}.rank as finalRank`)
            .andWhere(`${this.alias}.playerId = :playerId`, { playerId })
            .orderBy('score', 'DESC')
            .limit(1);
    }

    getPlayersStatByGameIdQuery(gameId: number) {
        return this.getBaseGameQuery(gameId)
            .select([
                `${this.alias}.nickname as nickname`,
                `${this.alias}.playerId as playerId`,
                `SUM(CASE WHEN ${this.alias}.isCorrect = 1 THEN 1 ELSE 0 END) AS numberOfCorrectAnswers`,
                `SUM(CASE WHEN ${this.alias}.timeSubmitted IS NULL THEN 1 ELSE 0 END) AS numberOfUnansweredQuestions`,
                `SUM(CASE WHEN ${this.alias}.isCorrect = 0 AND ${this.alias}.timeSubmitted IS NOT NULL THEN 1 ELSE 0 END) AS numberOfWrongAnswers`,
                `MAX(${this.alias}.strikeCount) AS longestStrikeCount`,
                `MAX(${this.alias}.score) AS score`,
            ])
            .groupBy(`${this.alias}.nickname`)
            .addGroupBy(`${this.alias}.playerId`)
            .orderBy('score', 'DESC');
    }

    async getGameHistoryStats(gameId: number) {
        const [playerStatsResult, questionsStatsResult] = await Promise.all([
            this.getPlayersStatByGameIdQuery(gameId).getRawMany(),
            this.getQuestionsByGameIdQuery(gameId).getRawMany(),
        ]);

        return {
            totalPlayers: playerStatsResult.length,
            players: playerStatsResult,
            questions: questionsStatsResult,
        };
    }

    async getPlayersByGameId(gameId: number) {
        const query = this.getPlayersStatByGameIdQuery(gameId);
        return query.getRawMany();
    }

    async getQuestionsByGameId(gameId: number) {
        const query = this.getQuestionsByGameIdQuery(gameId);
        return query.getRawMany();
    }

    async getPlayerDetailByGameId(gameId: number, playerId: number) {
        const query = this.getBaseGameQuery(gameId);
        query.andWhere(`${this.alias}.playerId = :playerId`, { playerId });
        query.select([
            `${this.alias}.nickname as nickname`,
            `${this.alias}.playerId as playerId`,
            `SUM(CASE WHEN ${this.alias}.isCorrect = 1 THEN 1 ELSE 0 END) AS numberOfCorrectAnswers`,
            `SUM(CASE WHEN ${this.alias}.timeSubmitted IS NULL THEN 1 ELSE 0 END) AS numberOfUnansweredQuestions`,
            `SUM(CASE WHEN ${this.alias}.isCorrect = 0 AND ${this.alias}.timeSubmitted IS NOT NULL THEN 1 ELSE 0 END) AS numberOfWrongAnswers`,
            `MAX(${this.alias}.strikeCount) AS longestStrikeCount`,
            `MAX(${this.alias}.score) AS score`,
        ]);
        query.groupBy(`${this.alias}.nickname`);
        query.addGroupBy(`${this.alias}.playerId`);

        const rankQuery = this.getRankByGameIdAndPlayerIdQuery(gameId, playerId);

        const questionStatByPlayerQuery = this.getBaseGameQuery(gameId)
            .select([
                `${this.alias}.pointAwarded as scoresGained`,
                `${this.alias}.score as currentScore`,
                `${this.alias}.strikeCount as currentStrikeCount`,
                `${this.alias}.numberOfCorrectAnswers as currentNumberOfCorrectAnswers`,
                `${this.alias}.rank as currentRank`,
                `${this.alias}.isCorrect as isCorrect`,
                `${this.alias}.timeSpent as timeSubmittedInSecond`,
                `q.id as questionId`,
                `q.questionText as questionText`,
                `q.questionType as questionType`,
                `q.timeLimitInSecond as timeLimitInSecond`,
            ])
            .leftJoin('question', 'q', `${this.alias}.questionId = q.id`)
            .andWhere(`${this.alias}.playerId = :playerId`, { playerId })
            .orderBy(`${this.alias}.questionId`, 'ASC');

        const [playerStatsResult, rankResult, questionStatByPlayerResult] = await Promise.all([
            query.getRawOne(),
            rankQuery.getRawOne(),
            questionStatByPlayerQuery.getRawMany(),
        ]);

        return {
            ...playerStatsResult,
            finalRank: rankResult?.finalRank || null,
            questions: questionStatByPlayerResult,
        };
    }

    async getQuestionDetailByGameId(gameId: number, questionId: number) {
        const mainQuery = this.getQuestionDetailByGameIdQuery(gameId, questionId);

        const playerStatsQuery = this.getBaseGameQuery(gameId)
            .select([
                `${this.alias}.playerId as playerId`,
                `${this.alias}.nickname as nickname`,
                `${this.alias}.playerAnswerInDb as playerAnswer`,
                `${this.alias}.isCorrect as isCorrect`,
                `${this.alias}.pointAwarded as scoresGained`,
                `${this.alias}.timeSpent as timeSubmittedInSecond`,
            ])
            .andWhere(`${this.alias}.questionId = :questionId`, { questionId })
            .orderBy(`${this.alias}.pointAwarded`, 'DESC');

        const [questionDetailResult, playerStatsResult] = await Promise.all([
            mainQuery.getRawOne(),
            playerStatsQuery.getRawMany(),
        ]);

        return {
            ...questionDetailResult,
            players: playerStatsResult,
        };
    }

    async getPlayersPerformanceByPlayerSearch(
        getPlayerPerformanceRequestDto: GetPlayerPerformanceRequestDto,
        accountId: number,
    ): Promise<[any, string]> {
        const query = this.createQb();
        query.select([
            `${this.alias}.nickname as nickname`,
            `${this.alias}.playerId as playerId`,
            `COUNT(DISTINCT(${this.alias}.gameId)) as totalGames`,
        ]);

        query.leftJoin('game', 'g', `${this.alias}.gameId = g.id`);
        query.leftJoin('quiz', 'q', `g.quizId = q.id`);

        if (getPlayerPerformanceRequestDto.searchPlayerName) {
            query.andWhere(`${this.alias}.nickname LIKE :searchPlayerName`, {
                searchPlayerName: `${getPlayerPerformanceRequestDto.searchPlayerName}%`,
            });
        }

        query.andWhere('q.accountId = :accountId', { accountId });
        query.groupBy(`${this.alias}.nickname`);
        query.addGroupBy(`${this.alias}.playerId`);

        if (getPlayerPerformanceRequestDto.page) {
            query.offset(
                (getPlayerPerformanceRequestDto.page - 1) * getPlayerPerformanceRequestDto.limit,
            );
        }

        if (getPlayerPerformanceRequestDto.limit) {
            query.limit(getPlayerPerformanceRequestDto.limit);
        }

        const countQuery = this.createQb();
        countQuery.select(`COUNT(DISTINCT ${this.alias}.playerId)`, 'totalPlayersCount');

        countQuery.leftJoin('game', 'g', `${this.alias}.gameId = g.id`);
        countQuery.leftJoin('quiz', 'q', `g.quizId = q.id`);

        if (getPlayerPerformanceRequestDto.searchPlayerName) {
            countQuery.andWhere(`${this.alias}.nickname LIKE :searchPlayerName`, {
                searchPlayerName: `${getPlayerPerformanceRequestDto.searchPlayerName}%`,
            });
        }

        countQuery.andWhere('q.accountId = :accountId', { accountId });

        const [players, total] = await Promise.all([query.getRawMany(), countQuery.getRawOne()]);

        return [players, total.totalPlayersCount];
    }

    async getGameHistoriesByPlayerNickname(
        getGamesPerformanceRequestDto: GetGamesPerformanceRequestDto,
        accountId: number,
    ): Promise<any> {
        const query = this.createQb();

        const { playerNickname } = getGamesPerformanceRequestDto;

        query.where(`${this.alias}.nickname = :playerNickname`, { playerNickname });
        query.leftJoin('game', 'g', `${this.alias}.gameId = g.id`);
        query.leftJoin('quiz', 'q', `g.quizId = q.id`);
        query.andWhere('q.accountId = :accountId', { accountId });

        query
            .select([
                `${this.alias}.nickname as nickname`,
                `g.id as gameId`,
                `g.createdAt as startedAt`,
                `g.updatedAt as endedAt`,
                `q.name as quizName`,
                `g.gameStatus as gameStatus`,
            ])
            .distinct(true);

        return query.getRawMany();
    }

    async getGameInformationForPerformanceDetail(allUniqueGames: number[]): Promise<any[]> {
        const query = this.createQb();

        query.where(`${this.alias}.gameId IN (:...allUniqueGames)`, { allUniqueGames });

        query.leftJoin('game', 'g', `${this.alias}.gameId = g.id`);
        query.leftJoin('quiz', 'q', 'g.quizId = q.id');

        query.groupBy(`${this.alias}.gameId`);

        query.select([
            `${this.alias}.gameId AS gameId`,
            `q.name AS quizName`,
            `g.createdAt AS startedAt`,
            `g.updatedAt AS endedAt`,
            `MAX(${this.alias}.score) AS highestScore`,
            `MIN(${this.alias}.score) AS lowestScore`,
            `AVG(${this.alias}.score) AS averageScore`,
            `MAX(${this.alias}.strikeCount) AS longestStrikeCount`,
            `COUNT(DISTINCT ${this.alias}.playerId) AS totalPlayers`,
            `COUNT(DISTINCT ${this.alias}.questionId) AS totalQuestions`,
            `AVG(${this.alias}.timeSpent) AS averageResponseTime`,
        ]);

        return query.getRawMany();
    }

    async getPerformanceDetail(
        allUniqueGames: number[],
        allUniquePlayers: string[],
        playerGameRequestDto: PlayerGameRequestDto[],
        accountId: number,
    ): Promise<any[]> {
        const playerPerformanceQuery = this.createQb();
        playerPerformanceQuery.where(`${this.alias}.gameId IN (:...allUniqueGames)`, {
            allUniqueGames,
        });

        playerPerformanceQuery.andWhere(`${this.alias}.nickname IN (:...allUniquePlayers)`, {
            allUniquePlayers,
        });

        // Dynamically handle multiple player-game pairs
        if (playerGameRequestDto.length > 0) {
            const orConditions = playerGameRequestDto
                .map((playerGame, index) => {
                    return `(${this.alias}.nickname = :nickname_${index} AND ${this.alias}.gameId = :gameId_${index})`;
                })
                .join(' OR ');

            const params = playerGameRequestDto.reduce((acc, playerGame, index) => {
                acc[`nickname_${index}`] = playerGame.playerNickname;
                acc[`gameId_${index}`] = playerGame.gameId;
                return acc;
            }, {});

            playerPerformanceQuery.andWhere(`(${orConditions})`, params);
        }

        playerPerformanceQuery.leftJoin('game', 'g', `${this.alias}.gameId = g.id`);
        playerPerformanceQuery.leftJoin('quiz', 'q', 'g.quizId = q.id');

        playerPerformanceQuery.andWhere('q.accountId = :accountId', { accountId });

        playerPerformanceQuery.groupBy(`${this.alias}.gameId`);
        playerPerformanceQuery.addGroupBy(`${this.alias}.nickname`);

        playerPerformanceQuery.select([
            `${this.alias}.nickname as nickname`, // Player nickname
            `${this.alias}.gameId AS gameId`, // Game ID
            `MAX(${this.alias}.score) AS maxScore`, // Max score
            `SUBSTRING_INDEX(GROUP_CONCAT(${this.alias}.rank ORDER BY ${this.alias}.questionId ASC), ',', -1) AS finalRank`, // Final ranking (last rank after ordering by question)
            `AVG(${this.alias}.timeSpent) AS avgResponseTime`, // Average response time
            `SUM(${this.alias}.isCorrect) AS numberOfCorrectAnswers`, // Number of correct answers
            `MAX(${this.alias}.strikeCount) AS longestStrikeCount`, // Longest strike count
        ]);

        return playerPerformanceQuery.getRawMany();
    }
}
