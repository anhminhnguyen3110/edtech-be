import { EFolderName } from '@app/common/constants/s3.constant';
import { Quiz } from '@app/common/domain/quiz.domain';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { CreateQuizRequestDto } from 'apps/api/src/modules/quiz/dtos/create-quiz-request.dto';
import { CreateQuizResponseDto } from 'apps/api/src/modules/quiz/dtos/create-quiz-response.dto';
import {
    GetQuizDetailResponseDto,
    GetQuizResponseDto,
} from 'apps/api/src/modules/quiz/dtos/get-quiz-response.dto';
import { UpdateQuizRequestDto } from 'apps/api/src/modules/quiz/dtos/update-quiz-request.dto';

import { mapQuestionEntityToQuestionDomain } from '../../question/mappers/question.mapper';
import { QuizEntity } from '../models/quiz.entity';

export function mapQuizEntityToQuizDomain(quizEntity: QuizEntity): Quiz {
    const quiz = new Quiz();
    quiz.id = quizEntity.id;
    quiz.name = quizEntity.name;
    quiz.description = quizEntity.description;
    quiz.classAssignmentId = quizEntity.classAssignmentId;
    quiz.accountId = quizEntity.accountId;
    quiz.createdAt = quizEntity.createdAt;
    quiz.updatedAt = quizEntity.updatedAt;
    quiz.questions = [];
    if (!quizEntity.questions) return quiz;
    for (const question of quizEntity.questions) {
        quiz.questions.push(
            mapQuestionEntityToQuestionDomain(
                question,
                `${EFolderName.QUESTION_IMAGE}/quiz_id_${quiz.id}/question_id_${question.id}.${
                    question.imageFormat || 'jpg'
                }`,
            ),
        );
    }
    return quiz;
}

export function mapEntityToGetQuizResponseDto(quizEntity: QuizEntity): GetQuizResponseDto {
    const response = new GetQuizResponseDto();
    response.id = quizEntity.id;
    response.name = quizEntity.name;
    response.description = quizEntity.description;
    response.classAssignmentId = quizEntity.classAssignmentId;
    response.totalQuestions = quizEntity.questions.length;
    return response;
}

export function mapQuizEntityToGetQuizDetailResponseDto(
    quizEntity: QuizEntity,
): GetQuizDetailResponseDto {
    const response = new GetQuizDetailResponseDto();
    response.id = quizEntity.id;
    response.name = quizEntity.name;
    response.description = quizEntity.description;
    response.classAssignmentId = quizEntity.classAssignmentId;
    response.questions = [];
    for (const question of quizEntity.questions) {
        response.questions.push(
            mapQuestionEntityToQuestionDomain(
                question,
                `${EFolderName.QUESTION_IMAGE}/quiz_id_${quizEntity.id}/question_id_${question.id}.${question.imageFormat}`,
            ),
        );
    }
    return response;
}

export function mapQuizEntityToCreateQuizResponseDto(
    quizEntity: QuizEntity,
): CreateQuizResponseDto {
    const response = new CreateQuizResponseDto();
    response.id = quizEntity.id;
    response.name = quizEntity.name;
    response.description = quizEntity.description;
    response.classAssignmentId = quizEntity.classAssignmentId;
    return response;
}

export function mapCreateQuizRequestDtoToQuizEntity(
    createQuizRequestDto: CreateQuizRequestDto,
    userPayload: UserPayloadDto,
): QuizEntity {
    const newQuiz = new QuizEntity();
    Object.assign(newQuiz, {
        ...createQuizRequestDto,
        accountId: userPayload.id,
    });
    return newQuiz;
}

export function mapUpdateQuizRequestDtoToQuizEntity(
    updateQuizRequestDto: UpdateQuizRequestDto,
    existingQuizEntity: QuizEntity,
): QuizEntity {
    Object.assign(existingQuizEntity, updateQuizRequestDto);
    return existingQuizEntity;
}
