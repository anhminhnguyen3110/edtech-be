// Adjust the import path as needed
import { EQuestionType } from '@app/common/constants/table.constant';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetQuestionResponseDto } from 'apps/api/src/modules/question/dtos/get-question-response.dto';
import * as moment from 'moment';

import { EConfig } from '../../config/interfaces/config.interface';
import { GetPlayerResponseDto, GetPlayersAnswerResponseDto } from './dtos/get-player-response.dto';

@Injectable()
export class GameHelperService {
    constructor(private readonly configService: ConfigService) {}

    checkAnswer(question: GetQuestionResponseDto, answer: string | string[]): boolean {
        if (!answer || !question.correctAnswers) {
            return false;
        }

        if (question.questionType === EQuestionType.SHORT_ANSWER) {
            const lowerCaseCorrectAnswers = question.correctAnswers.map(ans => ans.toLowerCase());
            return lowerCaseCorrectAnswers.includes((answer as string).toLowerCase());
        } else {
            if (Array.isArray(answer)) {
                return (
                    answer.every(ans => question.correctAnswers.includes(ans)) &&
                    answer.length === question.correctAnswers.length
                );
            } else {
                // Check if the single answer is correct
                return question.correctAnswers.includes(answer);
            }
        }
    }

    calculateScore(players: GetPlayerResponseDto[], isCorrects: boolean[]): GetPlayerResponseDto[] {
        // Sort players by timeSubmitted using moment
        const sortedPlayersByTime = players
            .map((player, index) => ({
                ...player,
                isCorrect: isCorrects[index],
            }))
            .sort((a, b) =>
                moment(a.recentAnswerQuestion?.timeSubmitted).diff(
                    moment(b.recentAnswerQuestion?.timeSubmitted),
                ),
            );

        const allCorrectPlayer = sortedPlayersByTime.filter(player => player.isCorrect);

        const maxScoreBank = parseInt(this.configService.get(EConfig.QUIZ_MAX_SCORE_BANK));
        let scoreBank = maxScoreBank;

        const updatedPlayers = sortedPlayersByTime.map(player => {
            const { score = 0, strikeCount = 0, recentAnswerQuestion } = player;

            const baseScore = parseInt(
                this.configService.get(EConfig.BASE_SCORE_REWARD_FOR_CORRECT_ANSWER),
            );
            const isCorrect = player.isCorrect;

            const strikeMultiplier = Math.max(
                1,
                strikeCount / parseInt(this.configService.get(EConfig.STRIKE_IMPACT_ON_SCORE)) + 1,
            );

            let finalScore = score;
            let pointAwarded = 0;
            if (isCorrect) {
                pointAwarded = baseScore * strikeMultiplier + scoreBank;
                finalScore = score + pointAwarded;
                scoreBank -= maxScoreBank / allCorrectPlayer.length;
            }
            player.recentAnswerQuestion = {
                ...recentAnswerQuestion,
                pointAwarded,
                isCorrect,
            };

            return {
                ...player,
                numberOfCorrectAnswers: player.numberOfCorrectAnswers + (isCorrect ? 1 : 0),
                score: finalScore,
                strikeCount: isCorrect ? strikeCount + 1 : 0,
            };
        });

        // Sort players by updated score for ranking
        const sortedPlayersByScore = updatedPlayers.sort((a, b) => b.score - a.score);

        // Assign ranks based on sorted scores
        return sortedPlayersByScore.map((player, index) => ({
            ...player,
            rank: index + 1,
        }));
    }

    generateQuestionStatistic(
        playersAnswered: GetPlayersAnswerResponseDto[],
        question: GetQuestionResponseDto,
    ): any {
        const questionStatistic: any = {};
        const answerCounts: { [key: string]: number } = {};
        let playersDidNotAnswer = 0;

        playersAnswered.forEach(player => {
            if (!player.playerAnswer || player.playerAnswer.length === 0) {
                playersDidNotAnswer++;
            } else if (
                question.questionType === EQuestionType.MULTIPLE_CHOICE ||
                question.questionType === EQuestionType.TRUE_FALSE ||
                question.questionType === EQuestionType.MULTIPLE_OPTIONS
            ) {
                player.playerAnswer.forEach(answer => {
                    if (!answerCounts[answer]) {
                        answerCounts[answer] = 0;
                    }
                    answerCounts[answer]++;
                });
            } else if (question.questionType === EQuestionType.SHORT_ANSWER) {
                const uniqueAnswers = new Set(
                    playersAnswered
                        .filter(player => player.playerAnswer && player.playerAnswer.length > 0)
                        .map(player => player.playerAnswer[0].toLowerCase().trim()),
                );
                questionStatistic.uniqueAnswers = Array.from(uniqueAnswers);
            }
        });

        if (
            question.questionType === EQuestionType.MULTIPLE_CHOICE ||
            question.questionType === EQuestionType.TRUE_FALSE ||
            question.questionType === EQuestionType.MULTIPLE_OPTIONS
        ) {
            questionStatistic.answerCounts = answerCounts;
        }

        questionStatistic.playersDidNotAnswer = playersDidNotAnswer;

        return questionStatistic;
    }
}
