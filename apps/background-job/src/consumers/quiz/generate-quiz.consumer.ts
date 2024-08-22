import { ECommandNotification, ECommandQuiz } from '@app/common/constants/command.constant';
import { EBullQueue, EBullQueueMessage } from '@app/common/constants/queue.constant';
import {
    EChatService,
    ELoggerService,
    ERegisterMicroservice,
} from '@app/common/constants/service.constant';
import { EQuestionType } from '@app/common/constants/table.constant';
import { ENotificationEventType } from '@app/common/constants/ws.constant';
import { Question } from '@app/common/domain/question.domain';
import { LanguageModelAbstract } from '@app/common/language-model/language-model.abstract';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import {
    OnQueueActive,
    OnQueueCompleted,
    OnQueueError,
    OnQueueFailed,
    OnQueueWaiting,
    Process,
    Processor,
} from '@nestjs/bull';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateNotificationRequestDto } from 'apps/api/src/modules/notification/dtos/create-notification-request.dto';
import { CreateQuestionRequestDto } from 'apps/api/src/modules/question/dtos/create-question-request.dto';
import {
    CreateQuizRequestDto,
    GenerateQuizRequestDto,
} from 'apps/api/src/modules/quiz/dtos/create-quiz-request.dto';
import { Job } from 'bull';

@Processor(EBullQueue.GENERATE_QUIZ_QUEUE)
export class GenerateQuizConsumer {
    private temperature = 0;
    constructor(
        @Inject(ELoggerService.LOGGER_KEY) private readonly logger: ILogger,
        @Inject(EChatService.CHAT_SERVICE)
        private readonly chatService: LanguageModelAbstract,
        @Inject(ERegisterMicroservice.QUIZ_SERVICE_RABBIT_MQ)
        private readonly quizService: ClientProxy,
        @Inject(ERegisterMicroservice.API_SERVICE_RABBIT_MQ)
        private readonly apiService: ClientProxy,
    ) {}

    @OnQueueActive()
    @Process({
        name: EBullQueueMessage.GENERATE_QUIZ,
        concurrency: 3,
    })
    async onActive(job: Job) {
        this.logger.info(`Processing job ${job.id} of type ${job.name}.`);

        const {
            data,
        }: {
            data: GenerateQuizRequestDto;
        } = job;

        const questions: Question[] = [];
        try {
            const quizName = await this.generateQuizName(data);
            const description = `This quiz is generated by AI assistant. The prompt is: ${data.prompt}`;
            data.quiz = new CreateQuizRequestDto();
            data.quiz.name = quizName;
            data.quiz.description = description;
            data.quiz.classAssignmentId = data.classAssignmentId;

            if (data.classAssignmentId) {
                data.prompt = `Generate a quiz students focusing on solving the issues identified in the class assignment.`;
                this.logger.warn(
                    `Generating quiz for issue with prompt: ${data.prompt} and class assignment id: ${data.classAssignmentId}`,
                );
                let multipleOptionsQuestions =
                    (
                        await this.chatService.sendMessageToModel(
                            await this.generateQuizMultipleOptionsQuestionPromptDesign(data),
                            this.temperature,
                        )
                    )?.questions || [];

                multipleOptionsQuestions = multipleOptionsQuestions.filter(
                    async (question: any) => {
                        return await this.validateQuiz(question);
                    },
                );

                multipleOptionsQuestions.forEach((question: any) => {
                    const newQuestion = new Question();
                    newQuestion.questionText = question.questionText;
                    newQuestion.questionType = EQuestionType.MULTIPLE_OPTIONS;
                    newQuestion.choices = question.choices;
                    newQuestion.correctAnswers = question.correctAnswers;
                    newQuestion.timeLimitInSecond = 30;

                    const [isValid, message] = newQuestion.validate();
                    if (!isValid) {
                        this.logger.error(message);
                    } else {
                        questions.push(newQuestion);
                    }
                });

                this.logger.debug(
                    `Successfully generated Quiz with ${questions.length} questions with prompt: ${data.prompt} for multiple options questions`,
                );

                let multipleChoiceQuestions =
                    (
                        await this.chatService.sendMessageToModel(
                            await this.generateQuizMultipleChoiceQuestionPromptDesign(
                                data,
                                multipleOptionsQuestions,
                            ),
                            this.temperature,
                        )
                    )?.questions || [];

                multipleChoiceQuestions = multipleChoiceQuestions.filter(async (question: any) => {
                    return await this.validateQuiz(question);
                });

                multipleChoiceQuestions.forEach((question: any) => {
                    const newQuestion = new Question();
                    newQuestion.questionText = question.questionText;
                    newQuestion.questionType = EQuestionType.MULTIPLE_CHOICE;
                    newQuestion.choices = question.choices;
                    newQuestion.correctAnswers = question.correctAnswers;
                    newQuestion.timeLimitInSecond = 30;

                    const [isValid, message] = newQuestion.validate();

                    if (!isValid) {
                        this.logger.error(message);
                    } else {
                        questions.push(newQuestion);
                    }
                });

                this.logger.debug(
                    `Successfully generated Quiz with ${questions.length} questions with prompt: ${data.prompt} for multiple choice questions`,
                );

                let trueFalseQuestions =
                    (
                        await this.chatService.sendMessageToModel(
                            await this.generateQuizTrueFalseQuestionPromptDesign(data, [
                                ...multipleOptionsQuestions,
                                ...multipleChoiceQuestions,
                            ]),
                            this.temperature,
                        )
                    )?.questions || [];

                trueFalseQuestions = trueFalseQuestions.filter(async (question: any) => {
                    return await this.validateQuiz(question);
                });

                trueFalseQuestions.forEach((question: any) => {
                    const newQuestion = new Question();
                    newQuestion.questionText = question.questionText;
                    newQuestion.questionType = EQuestionType.TRUE_FALSE;
                    newQuestion.choices = question.choices;
                    newQuestion.correctAnswers = question.correctAnswers;
                    newQuestion.timeLimitInSecond = 30;

                    const [isValid, message] = newQuestion.validate();

                    if (!isValid) {
                        this.logger.error(message);
                    } else {
                        questions.push(newQuestion);
                    }
                });

                this.logger.debug(
                    `Successfully generated Quiz with ${questions.length} questions with prompt: ${data.prompt} for true false questions`,
                );
            } else {
                this.logger.warn(`Generating quiz for general purpose with prompt: ${data.prompt}`);

                let multipleOptionsQuestions =
                    (
                        await this.chatService.sendMessageToModel(
                            await this.generateQuizMultipleOptionsGeneralQuestionPromptDesign(data),
                            this.temperature,
                        )
                    )?.questions || [];

                multipleOptionsQuestions = multipleOptionsQuestions.filter(
                    async (question: any) => {
                        return await this.validateQuiz(question);
                    },
                );

                multipleOptionsQuestions.forEach((question: any) => {
                    const newQuestion = new Question();
                    newQuestion.questionText = question.questionText;
                    newQuestion.questionType = EQuestionType.MULTIPLE_OPTIONS;
                    newQuestion.choices = question.choices;
                    newQuestion.correctAnswers = question.correctAnswers;
                    newQuestion.timeLimitInSecond = 30;

                    const [isValid, message] = newQuestion.validate();
                    if (!isValid) {
                        this.logger.error(message);
                    } else {
                        questions.push(newQuestion);
                    }
                });

                this.logger.debug(
                    `Successfully generated Quiz with ${questions.length} questions with prompt: ${data.prompt} for multiple options questions`,
                );

                let multipleChoiceQuestions =
                    (
                        await this.chatService.sendMessageToModel(
                            await this.generateQuizMultipleChoiceGeneralQuestionPromptDesign(
                                data,
                                multipleOptionsQuestions,
                            ),
                            this.temperature,
                        )
                    )?.questions || [];

                multipleChoiceQuestions = multipleChoiceQuestions.filter(async (question: any) => {
                    return await this.validateQuiz(question);
                });

                multipleChoiceQuestions.forEach((question: any) => {
                    const newQuestion = new Question();
                    newQuestion.questionText = question.questionText;
                    newQuestion.questionType = EQuestionType.MULTIPLE_CHOICE;
                    newQuestion.choices = question.choices;
                    newQuestion.correctAnswers = question.correctAnswers;
                    newQuestion.timeLimitInSecond = 30;

                    const [isValid, message] = newQuestion.validate();

                    if (!isValid) {
                        this.logger.error(message);
                    } else {
                        questions.push(newQuestion);
                    }
                });

                this.logger.debug(
                    `Successfully generated Quiz with ${questions.length} questions with prompt: ${data.prompt} for multiple choice questions`,
                );

                let trueFalseQuestions =
                    (
                        await this.chatService.sendMessageToModel(
                            await this.generateQuizTrueFalseGeneralQuestionPromptDesign(data, [
                                ...multipleOptionsQuestions,
                                ...multipleChoiceQuestions,
                            ]),
                            this.temperature,
                        )
                    )?.questions || [];

                trueFalseQuestions = trueFalseQuestions.filter(async (question: any) => {
                    return await this.validateQuiz(question);
                });

                trueFalseQuestions.forEach((question: any) => {
                    const newQuestion = new Question();
                    newQuestion.questionText = question.questionText;
                    newQuestion.questionType = EQuestionType.TRUE_FALSE;
                    newQuestion.choices = question.choices;
                    newQuestion.correctAnswers = question.correctAnswers;
                    newQuestion.timeLimitInSecond = 30;

                    const [isValid, message] = newQuestion.validate();

                    if (!isValid) {
                        this.logger.error(message);
                    } else {
                        questions.push(newQuestion);
                    }
                });

                this.logger.debug(
                    `Successfully generated Quiz with ${questions.length} questions with prompt: ${data.prompt} for true false questions`,
                );
            }
        } catch (error) {
            this.logger.error(error);

            const createNotificationRequestDto: CreateNotificationRequestDto = {
                message:
                    ((error.message || error || 'Internal server error') as string) +
                    `with class assignment id: ${data.classAssignmentId} and prompt: ${data.prompt}`,
                eventType: ENotificationEventType.GENERATE_QUIZ_FAILED,
                classAssignmentId: data.classAssignmentId ? data.classAssignmentId : undefined,
            };

            this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
                createNotificationRequestDto,
                accountId: data.accountId,
            });
        }

        data.questions = [];
        questions.forEach(async question => {
            const createQuestionRequestDto: CreateQuestionRequestDto =
                new CreateQuestionRequestDto();
            createQuestionRequestDto.questionText = question.questionText;
            createQuestionRequestDto.questionType = question.questionType;
            createQuestionRequestDto.choices = question.choices;
            createQuestionRequestDto.correctAnswers = question.correctAnswers;
            createQuestionRequestDto.timeLimitInSecond = question.timeLimitInSecond;
            data.questions.push(createQuestionRequestDto);
        });

        this.quizService.emit(ECommandQuiz.SAVE_GENERATE_QUIZ, {
            generateQuizRequestDto: data,
        });
    }

    async generateQuizName(data: GenerateQuizRequestDto) {
        const prompt = `
			I have this prompt for you: "${data.prompt}"
			I want you to generate a name for the quiz.
			Here is an example of JSON output:
			{
				"name": "Quiz for English"
			}
			Output:
		`;

        const result = await this.chatService.sendMessageToModel(prompt, this.temperature);

        return result?.name || 'Quiz generated by AI';
    }

    async generateQuizMultipleChoiceQuestionPromptDesign(
        data: GenerateQuizRequestDto,
        previousQuestion?: any,
    ) {
        return `As an educator, your task is to create a series of engaging multiple-choice quiz questions for ${
            data.year
        } students, focusing on the English subject. The quiz will address various issues identified in a previous class assignment.

			Your challenge is to construct ${
                data.numberOfMultipleChoiceQuestions
            } multiple-choice questions. Each question must have 4 options and only 1 correct answer.

			${
                previousQuestion
                    ? `There are some previous questions generated that is: ${JSON.stringify(
                          previousQuestion,
                      )}. Please do not repeat the same question.`
                    : ''
            }

		Guidelines:
			- Develop questions that directly reinforce the knowledge areas flagged in the class's assignment.
			- Ensure each question is clear, concise, and free of any ambiguous language.
			- Use British English spellings (e.g., 'colour' instead of 'color').
			- Design questions to be challenging yet appropriate for the comprehension level of ${
                data.year
            } students.
			- Craft questions that promote critical thinking and are free from any bias or leading content.
			- Avoid repeating the same question.
			- Question must be multiple-choice type.
			- Answer must exist in the choices. The correct answer must be 1 of the choices. Choices must contain the correct answer.
			- Choices are 4 options. Choices must be unique.
			- Correct answer is 1 of the choices. The answer length is 1.

			The identified issues from the class assignment are: ${JSON.stringify(data.issues)}

		Expected JSON output format:
			{
				"questions": [
					{
						"questionText": "<question>",
						"choices": ["Option 1", "Option 2", "Option 3", "Option 4"],
						"correctAnswers": ["Option 2"]
					},
					{
						"questionText": "<question>",
						"choices": ["Option 1", "Option 2", "Option 3", "Option 4"],
						"correctAnswers": ["Option 3"]
					},
					{
						"questionText": "<question>",
						"choices": ["Option 1", "Option 2", "Option 3", "Option 4"],
						"correctAnswers": ["Option 1"]
					}
				]
			}
		Output:
		`;
    }

    async generateQuizMultipleChoiceGeneralQuestionPromptDesign(
        data: GenerateQuizRequestDto,
        previousQuestion?: any,
    ) {
        return `As an educator, your task is to create a series of engaging multiple-choice quiz questions, focusing on the English subject. Here is the requirement for the quiz: ${
            data.prompt
        }

            Your challenge is to construct ${
                data.numberOfMultipleChoiceQuestions
            } multiple-choice questions. Each question must have 4 options and only 1 correct answer.

            ${
                previousQuestion
                    ? `There are some previous questions generated that is: ${JSON.stringify(
                          previousQuestion,
                      )}. Please do not repeat the same question.`
                    : ''
            }

            Guidelines:
                - Ensure each question is clear, concise, and free of any ambiguous language.
                - Use British English spellings (e.g., 'colour' instead of 'color').
                - Craft questions that promote critical thinking and are free from any bias or leading content.
                - Avoid repeating the same question.
                - Question must be multiple-choice type.
                - Answer must exist in the choices. The correct answer must be 1 of the choices. Choices must contain the correct answer.
                - Choices are 4 options. Choices must be unique.
                - Correct answer is 1 of the choices. The answer length is 1.

            Expected JSON output format:
                {
                    "questions": [
                        {
                            "questionText": "<question>",
                            "choices": ["Option 1", "Option 2", "Option 3", "Option 4"],
                            "correctAnswers": ["Option 2"]
                        },
                        {
                            "questionText": "<question>",
                            "choices": ["Option 1", "Option 2", "Option 3", "Option 4"],
                            "correctAnswers": ["Option 3"]
                        },
                        {
                            "questionText": "<question>",
                            "choices": ["Option 1", "Option 2", "Option 3", "Option 4"],
                            "correctAnswers": ["Option 1"]
                        }
                    ]
                }

            Output:
        `;
    }

    async validateQuiz(data: any): Promise<boolean> {
        const schema = {
            questionText: 'string',
            choices: 'array',
            correctAnswers: 'array',
        };

        function validateSchema(obj: any, schema: any, path = ''): any {
            for (const key in schema) {
                if (schema.hasOwnProperty(key)) {
                    const expectedType = schema[key];
                    const value = obj[key];

                    if (!obj.hasOwnProperty(key)) {
                        return `Missing key '${path}${key}'`;
                    }

                    if (expectedType === 'array') {
                        if (!Array.isArray(value)) {
                            return `Invalid type for '${path}${key}', expected 'array' but got '${typeof value}'`;
                        }
                        for (const item of value) {
                            if (typeof item !== 'string') {
                                return `Invalid type for items in '${path}${key}', expected 'string' but got '${typeof item}'`;
                            }
                        }
                    } else if (typeof value !== expectedType) {
                        return `Invalid type for '${path}${key}', expected '${expectedType}' but got '${typeof value}'`;
                    }
                }
            }
            return true;
        }

        if (typeof data !== 'object') {
            this.logger.error('Invalid data type');
            return false;
        }

        const validationResult = validateSchema(data, schema);
        if (validationResult !== true) {
            this.logger.error(`Invalid question: ${validationResult}`);
            return false;
        }
        return true;
    }

    async generateQuizTrueFalseQuestionPromptDesign(
        data: GenerateQuizRequestDto,
        previousQuestion?: any,
    ) {
        return `As an educator, your task is to create a series of engaging true or false quiz questions for ${
            data.year
        } students, focusing on the English subject. The quiz will address various issues identified in a previous class assignment.
		 
			Your challenge is to construct ${data.numberOfTrueFalseQuestions} true or false questions.

			${
                previousQuestion
                    ? `There are some previous questions generated that is: ${JSON.stringify(
                          previousQuestion,
                      )}. Please do not repeat the same question.`
                    : ''
            }

			Guidelines:
				- Develop questions that directly reinforce the knowledge areas flagged in the class's assignment.
				- Ensure each question is clear, concise, and free of any ambiguous language.
				- Use British English spellings (e.g., 'colour' instead of 'color').
				- Design questions to be challenging yet appropriate for the comprehension level of ${
                    data.year
                } students.
				- Craft questions that promote critical thinking and are free from any bias or leading content.
				- Avoid repeating the same question.
				- Question must be true/false type.
				- Answer must exist in the choices. The correct answer must be 1 of the choices. Choices must contain the correct answer.
				- Choices are True or False.
				- Correct answer is either True or False and answer length is 1.

				The identified issues from the class assignment are: ${JSON.stringify(data.issues)}

			Expected JSON output format:
				{
					"questions": [
						{
							"questionText": "<question>",
							"choices": ["True", "False"],
							"correctAnswers": ["True"]
						},
						{
							"questionText": "<question>",
							"choices": ["True", "False"],
							"correctAnswers": ["False"]
						},
						{
							"questionText": "<question>",
							"choices": ["True", "False"],
							"correctAnswers": ["True"]
						}
					]
				}
			Output:
		`;
    }

    async generateQuizTrueFalseGeneralQuestionPromptDesign(
        data: GenerateQuizRequestDto,
        previousQuestion?: any,
    ) {
        return `As an educator, your task is to create a series of engaging true or false quiz questions. Here is the requirement for the quiz: ${
            data.prompt
        }

            Your challenge is to construct ${
                data.numberOfTrueFalseQuestions
            } true or false questions.

            ${
                previousQuestion
                    ? `There are some previous questions generated that is: ${JSON.stringify(
                          previousQuestion,
                      )}. Please do not repeat the same question.`
                    : ''
            }

            Guidelines:
                - Ensure each question is clear, concise, and free of any ambiguous language.
                - Use British English spellings (e.g., 'colour' instead of 'color').
                - Craft questions that promote critical thinking and are free from any bias or leading content.
                - Avoid repeating the same question.
                - Question must be true/false type.
                - Answer must exist in the choices. The correct answer must be 1 of the choices. Choices must contain the correct answer.
                - Choices are True or False.
                - Correct answer is either True or False and answer length is 1.

            Expected JSON output format:
                {
                    "questions": [
                        {
                            "questionText": "<question>",
                            "choices": ["True", "False"],
                            "correctAnswers": ["True"]
                        },
                        {
                            "questionText": "<question>",
                            "choices": ["True", "False"],
                            "correctAnswers": ["False"]
                        },
                        {
                            "questionText": "<question>",
                            "choices": ["True", "False"],
                            "correctAnswers": ["True"]
                        }
                    ]
                }

            Output:
        `;
    }

    async generateQuizMultipleOptionsQuestionPromptDesign(
        data: GenerateQuizRequestDto,
        previousQuestion?: any,
    ) {
        return `As an educator, your task is to create a series of engaging multiple-answers quiz questions for ${
            data.year
        } students, focusing on the English subject. The quiz will address various issues identified in a previous class assignment.
					 
			Your challenge is to construct ${data.numberOfMultipleAnswerQuestions} multiple-answers questions.

			${
                previousQuestion
                    ? `There are some previous questions generated that is: ${JSON.stringify(
                          previousQuestion,
                      )}. Please do not repeat the same question.`
                    : ''
            }

			Guidelines:
				- Develop questions that directly reinforce the knowledge areas flagged in the class's assignment.
				- Ensure each question is clear, concise, and free of any ambiguous language.
                - Use British English spellings (e.g., 'colour' instead of 'color').
                - Design questions to be challenging yet appropriate for the comprehension level of ${
                    data.year
                } students.
                - Craft questions that promote critical thinking and are free from any bias or leading content.
                - Avoid repeating the same question.
                - Question must be multiple-answers type.
                - Answers must exist in the choices. Choices must contain the correct answers.
                - Number of correct answers must be more than 1.
                - Choices are 4 options. Choices must be unique.
                - The answers length is greater than 1 and less than 4 (1 < answers < 4).

				The identified issues from the class assignment are: ${JSON.stringify(data.issues)}

			Expected JSON output format:
				{
					"questions": [
						{
							"questionText": "<question>",
							"choices": ["Option 1", "Option 2", "Option 3", "Option 4"],
							"correctAnswers": ["Option 1", "Option 3", "Option 4"]
						},
						{
							"questionText": "<question>",
							"choices": ["Option 1", "Option 2", "Option 3", "Option 4"],
							"correctAnswers": ["Option 2", "Option 4", "Option 1"]
						},
						{
							"questionText": "<question>",
							"choices": ["Option 1", "Option 2", "Option 3", "Option 4"],
							"correctAnswers": ["Option 1", "Option 3"]
						},
						{
							"questionText": "<question>",
							"choices": ["Option 1", "Option 2", "Option 3", "Option 4"],
							"correctAnswers": ["Option 2", "Option 4"]
						}
					]
				}
			Output:
		`;
    }

    async generateQuizMultipleOptionsGeneralQuestionPromptDesign(
        data: GenerateQuizRequestDto,
        previousQuestion?: any,
    ) {
        return `As an educator, your task is to create a series of engaging multiple-choice quiz questions. Here is the requirement for the quiz: ${
            data.prompt
        }
			Your challenge is to construct ${
                data.numberOfMultipleChoiceQuestions
            } multiple-choice questions. Each question must have 4 options and only 1 correct answer.

			${
                previousQuestion
                    ? `There are some previous questions generated that is: ${JSON.stringify(
                          previousQuestion,
                      )}. Please do not repeat the same question.`
                    : ''
            }

		Guidelines:
            - Ensure each question is clear, concise, and free of any ambiguous language.
            - Use British English spellings (e.g., 'colour' instead of 'color').
            - Craft questions that promote critical thinking and are free from any bias or leading content.
            - Avoid repeating the same question.
            - Question must be multiple-answers type.
            - Answers must exist in the choices. Choices must contain the correct answers.
            - Number of correct answers must be more than 1.
            - Choices are 4 options. Choices must be unique.
            - The answers length is greater than 1 and less than 4 (1 < answers < 4).

		Expected JSON output format:
			{
                "questions": [
                    {
                        "questionText": "<question>",
                        "choices": ["Option 1", "Option 2", "Option 3", "Option 4"],
                        "correctAnswers": ["Option 1", "Option 3", "Option 4"]
                    },
                    {
                        "questionText": "<question>",
                        "choices": ["Option 1", "Option 2", "Option 3", "Option 4"],
                        "correctAnswers": ["Option 2", "Option 4", "Option 1"]
                    },
                    {
                        "questionText": "<question>",
                        "choices": ["Option 1", "Option 2", "Option 3", "Option 4"],
                        "correctAnswers": ["Option 1", "Option 3"]
                    },
                    {
                        "questionText": "<question>",
                        "choices": ["Option 1", "Option 2", "Option 3", "Option 4"],
                        "correctAnswers": ["Option 2", "Option 4"]
                    }
                ]
            }
		Output:
		`;
    }

    @OnQueueCompleted()
    async onComplete(job: Job, _: any) {
        this.logger.info(`Job ${job.id} has completed.`);
    }

    @OnQueueFailed()
    async onFailed(job: Job, error: any) {
        this.logger.error(`Job ${job.id} has failed with error: ${error.message}`);
    }

    @OnQueueError()
    async onError(error: Error) {
        this.logger.error(`Quiz generate has error: ${error.message}`);
    }

    @OnQueueWaiting()
    async onWaiting(jobId: number) {
        this.logger.info(`Quiz generate is waiting for job ${jobId}`);
    }
}
