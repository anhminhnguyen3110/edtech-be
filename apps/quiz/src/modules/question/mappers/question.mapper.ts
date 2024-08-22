import { Question } from '@app/common/domain/question.domain';
import { CreateQuestionResponseDto } from 'apps/api/src/modules/question/dtos/create-question-response.dto';

import { QuestionEntity } from '../models/question.entity';

export function mapQuestionEntityToQuestionDomain(
    questionEntity: QuestionEntity,
    filePath?: string,
): Question {
    const question = new Question();
    question.id = questionEntity.id;
    question.questionText = questionEntity.questionText;
    question.questionType = questionEntity.questionType;
    question.choices = questionEntity.choices;
    question.correctAnswers = questionEntity.correctAnswers;
    question.quizId = questionEntity.quizId;
    question.imageFileLocation = questionEntity !== null ? filePath : null;
    question.timeLimitInSecond = questionEntity.timeLimitInSecond;
    question.createdAt = questionEntity.createdAt;
    question.updatedAt = questionEntity.updatedAt;
    return question;
}

export function mapQuestionDomainToCreateQuestionResponse(
    question: Question,
): CreateQuestionResponseDto {
    const responseDto = new CreateQuestionResponseDto();
    responseDto.id = question.id;
    responseDto.questionText = question.questionText;
    responseDto.questionType = question.questionType;
    responseDto.choices = question.choices;
    responseDto.correctAnswers = question.correctAnswers;
    responseDto.quizId = question.quizId;
    responseDto.imageFileUrl = question.imageFileLocation;

    return responseDto;
}

export function mapQuestionDomainToQuestionEntity(question: Question): QuestionEntity {
    const questionEntity = new QuestionEntity();
    questionEntity.id = question.id;
    questionEntity.questionText = question.questionText;
    questionEntity.questionType = question.questionType;
    questionEntity.choices = question.choices;
    questionEntity.correctAnswers = question.correctAnswers;
    questionEntity.timeLimitInSecond = question.timeLimitInSecond;

    return questionEntity;
}

export function mapQuestionEntityToQuestionCreateQuestionResponse(
    questionEntity: QuestionEntity,
    filePath: string,
): CreateQuestionResponseDto {
    const responseDto = new CreateQuestionResponseDto();
    responseDto.id = questionEntity.id;
    responseDto.questionText = questionEntity.questionText;
    responseDto.questionType = questionEntity.questionType;
    responseDto.choices = questionEntity.choices;
    responseDto.correctAnswers = questionEntity.correctAnswers;
    responseDto.quizId = questionEntity.quiz.id;
    responseDto.imageFileUrl = filePath || null;

    return responseDto;
}
