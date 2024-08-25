import { EQuestionType } from '../constants/table.constant';
import { Quiz } from './quiz.domain';

export class Question {
    id?: number;
    questionText?: string;
    questionType?: EQuestionType;
    choices?: string[];
    correctAnswers?: string[];
    quiz: Quiz;
    quizId?: number;
    imageFileLocation?: string;
    timeLimitInSecond: number;
    createdAt: Date;
    updatedAt: Date;

    constructor() {}

    public validate(): [boolean, string] {
        if (this.timeLimitInSecond < 10 || this.timeLimitInSecond > 180) {
            return [false, 'Time limit must be between 10 and 180 seconds'];
        }

        if (!this.questionType) {
            return [false, 'Question type must be provided'];
        }

        switch (this.questionType) {
            case EQuestionType.MULTIPLE_CHOICE:
                if (!this.choices || !this.correctAnswers) {
                    return [
                        false,
                        'Choices and correct answer must be provided for multiple choice questions',
                    ];
                }

                if (this.correctAnswers.length !== 1) {
                    return [false, 'Correct answer must be only one for multiple choice questions'];
                }

                const onlyAnswer = this.correctAnswers[0];

                if (this.choices.length < 2 || this.choices.length > 4) {
                    return [false, 'Number of choices must be between 2 and 4'];
                }

                if (!this.choices.includes(onlyAnswer)) {
                    return [false, 'Correct answer must be one of the choices'];
                }

                if (new Set(this.choices).size !== this.choices.length) {
                    return [false, 'Choices must be unique'];
                }
                break;

            case EQuestionType.TRUE_FALSE:
                if (!this.correctAnswers || !this.choices) {
                    return [
                        false,
                        'Choices and correct answer must be provided for true/false questions',
                    ];
                }

                if (this.correctAnswers.length !== 1) {
                    return [false, 'Correct answer must be only one for true/false questions'];
                }

                if (!this.choices.includes(this.correctAnswers[0])) {
                    return [false, 'Correct answer must be one of the choices'];
                }

                if (this.choices.length !== 2) {
                    return [false, 'Number of choices must be 2 for true/false questions'];
                }

                const lowerCaseChoices = this.choices.map(choice => choice.toLowerCase());
                if (!lowerCaseChoices.includes('true') || !lowerCaseChoices.includes('false')) {
                    return [false, 'Choices must be "True" and "False" for true/false questions'];
                }

                const lowerCaseCorrectAnswers = this.correctAnswers.map(answer =>
                    answer.toLowerCase(),
                );
                if (
                    !lowerCaseCorrectAnswers.includes('true') &&
                    !lowerCaseCorrectAnswers.includes('false')
                ) {
                    return [
                        false,
                        'Correct answer must be "True" or "False" for true/false questions',
                    ];
                }
                break;

            case EQuestionType.SHORT_ANSWER:
                if (!this.correctAnswers) {
                    return [false, 'Correct answer must be provided for short answer questions'];
                }

                if (this.choices && this.choices.length >= 1) {
                    if (this.choices[0] !== '') {
                        return [false, 'Choices must not be provided for short answer questions'];
                    }
                }
                break;

            case EQuestionType.MULTIPLE_OPTIONS:
                if (!this.choices || !this.correctAnswers) {
                    return [
                        false,
                        'Choices and correct answer must be provided for multiple options questions',
                    ];
                }

                if (this.choices.length < 2 || this.choices.length > 4) {
                    return [false, 'Number of choices must be between 2 and 4'];
                }

                if (!this.correctAnswers.every(answer => this.choices.includes(answer))) {
                    return [false, 'All correct answers must be one of the choices'];
                }

                if (new Set(this.choices).size !== this.choices.length) {
                    return [false, 'Choices must be unique'];
                }

                if (this.correctAnswers.length < 2 || this.correctAnswers.length > 6) {
                    return [false, 'Number of correct answers must be between 2 and 6'];
                }
                break;

            default:
                return [false, 'Invalid question type'];
        }

        return [true, ''];
    }

    public checkAnswer(answer: string | string[]): boolean {
        if (!this.correctAnswers) {
            return false;
        }

        if (this.questionType === EQuestionType.SHORT_ANSWER) {
            const lowerCaseCorrectAnswers = this.correctAnswers.map(ans => ans.toLowerCase());
            return lowerCaseCorrectAnswers.includes((answer as string).toLowerCase());
        } else {
            if (Array.isArray(answer)) {
                // Check if all provided answers are correct
                return (
                    answer.every(ans => this.correctAnswers.includes(ans)) &&
                    answer.length === this.correctAnswers.length
                );
            } else {
                // Check if the single answer is correct
                return this.correctAnswers.includes(answer);
            }
        }
    }
}
