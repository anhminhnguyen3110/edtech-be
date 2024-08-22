import { ECommandLesson, ECommandNotification } from '@app/common/constants/command.constant';
import { EBullQueue, EBullQueueMessage } from '@app/common/constants/queue.constant';
import {
    EChatService,
    ELoggerService,
    ERegisterMicroservice,
} from '@app/common/constants/service.constant';
import { ENotificationEventType } from '@app/common/constants/ws.constant';
import { LanguageModelAbstract } from '@app/common/language-model/language-model.abstract';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import {
    InjectQueue,
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
import {
    ConclusionLessonDto,
    GenerateLessonRequestDto,
    IntroductionLessonDto,
    IssueLessonDto,
    LessonContentDto,
} from 'apps/api/src/modules/lesson/dtos/create-lesson-request.dto';
import { CreateNotificationRequestDto } from 'apps/api/src/modules/notification/dtos/create-notification-request.dto';
import { Job, Queue } from 'bull';

@Processor(EBullQueue.GENERATE_LESSON_QUEUE)
export class GenerateLessonConsumer {
    private readonly temperature = 0.4;

    constructor(
        @Inject(ELoggerService.LOGGER_KEY) private readonly logger: ILogger,
        @InjectQueue(EBullQueue.GENERATE_LESSON_FAILED_QUEUE)
        private readonly failedQueue: Queue,
        @Inject(EChatService.CHAT_SERVICE)
        private readonly chatService: LanguageModelAbstract,
        @Inject(ERegisterMicroservice.API_SERVICE_RABBIT_MQ)
        private readonly apiService: ClientProxy,
        @Inject(ERegisterMicroservice.ASSIGNMENT_SERVICE_RABBIT_MQ)
        private readonly assignmentService: ClientProxy,
    ) {}

    @OnQueueActive()
    @Process({
        name: EBullQueueMessage.GENERATE_LESSON,
        concurrency: 3,
    })
    async onActive(job: Job) {
        this.logger.info(`Generate lesson job ${job.id} is active`);
        const { data }: { data: GenerateLessonRequestDto } = job;

        try {
            await this.processGenerateLesson(data);
        } catch (error) {
            const createNotificationRequestDto: CreateNotificationRequestDto = {
                message:
                    ((error.message || error || 'Generate lesson failed') as string) +
                    `with class assignment id: ${data.classAssignmentId}`,
                eventType: ENotificationEventType.GENERATE_LESSON_FAILED,
                classAssignmentId: data.classAssignmentId,
            };

            this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
                createNotificationRequestDto,
                accountId: data.accountId,
            });

            this.failedQueue.add(data);

            return;
        }
    }

    async retryGenerateLesson(
        _: any,
        prompt: string,
        callbackRetry: Function,
        callbackValidate: Function,
    ) {
        const maxAttempts = 5;
        let attempts = 0;
        let lessonContent = null;
        let isValid = false;

        while (attempts < maxAttempts && !isValid) {
            this.logger.debug(`Retrying attempt ${attempts + 1}...`);
            try {
                lessonContent = await callbackRetry.call(this, prompt, this.temperature);

                isValid = await callbackValidate.call(this, lessonContent);
            } catch (error) {
                this.logger.error(`Attempt ${attempts + 1} encountered an error: ${error.message}`);
                return lessonContent;
            }

            attempts++;
        }

        return lessonContent;
    }

    async processGenerateLesson(data: GenerateLessonRequestDto) {
        const lessonContent: LessonContentDto = new LessonContentDto();

        // Generate Introduction
        const introductionPrompt = await this.generateIntroductionPromptDesign(data);

        let introductionResponse: IntroductionLessonDto = null;
        try {
            introductionResponse = await this.chatService.sendMessageToModel(
                introductionPrompt,
                this.temperature,
            );
        } catch (error) {
            this.logger.error(`Error while generating introduction: ${error.message}`);

            const createNotificationRequestDto: CreateNotificationRequestDto = {
                message:
                    ((error.message || error || 'Generate introduction failed') as string) +
                    `with class assignment id: ${data.classAssignmentId}`,
                eventType: ENotificationEventType.GENERATE_LESSON_FAILED,
                classAssignmentId: data.classAssignmentId,
            };

            this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
                createNotificationRequestDto,
                accountId: data.accountId,
            });

            return;
        }

        if (
            !introductionResponse ||
            !(await this.validateLessonIntroduction(introductionResponse))
        ) {
            introductionResponse = await this.retryGenerateLesson(
                introductionResponse,
                introductionPrompt,
                this.chatService.sendMessageToModel,
                this.validateLessonIntroduction,
            );
        }

        this.logger.debug(
            `Finished generating introduction with class assignment ${data.classAssignmentId}`,
        );

        if (introductionResponse && (await this.validateLessonIntroduction(introductionResponse))) {
            lessonContent.introduction = introductionResponse;
        } else {
            this.logger.error(
                `Failed to generate introduction response for class assignment ${data.classAssignmentId}`,
            );

            const createNotificationRequestDto: CreateNotificationRequestDto = {
                message: `Failed to generate introduction response for class assignment ${data.classAssignmentId}`,
                eventType: ENotificationEventType.GENERATE_LESSON_FAILED,
                classAssignmentId: data.classAssignmentId,
            };

            this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
                createNotificationRequestDto,
                accountId: data.accountId,
            });
        }

        lessonContent.issues = [];

        for (let i = 0; i < data.issues.length; i++) {
            const issuePrompt = await this.generateLessonPerIssuesPromptDesign(data, i);

            let issueResponse: IssueLessonDto = null;

            try {
                issueResponse = await this.chatService.sendMessageToModel(
                    issuePrompt,
                    this.temperature,
                );
            } catch (error) {
                this.logger.error(
                    `Error while generating content for issue ${i}: ${error.message}`,
                );

                const createNotificationRequestDto: CreateNotificationRequestDto = {
                    message:
                        ((error.message ||
                            error ||
                            `Generate content for issue ${i} failed`) as string) +
                        `with class assignment id: ${data.classAssignmentId}`,
                    eventType: ENotificationEventType.GENERATE_LESSON_FAILED,
                    classAssignmentId: data.classAssignmentId,
                };

                this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
                    createNotificationRequestDto,
                    accountId: data.accountId,
                });

                return;
            }

            if (!issueResponse || !(await this.validateLessonPerIssues(issueResponse))) {
                issueResponse = await this.retryGenerateLesson(
                    issueResponse,
                    issuePrompt,
                    this.chatService.sendMessageToModel,
                    this.validateLessonPerIssues,
                );
            }

            if (issueResponse && (await this.validateLessonPerIssues(issueResponse))) {
                lessonContent.issues.push(issueResponse);
            } else {
                this.logger.error(
                    `Failed to generate content for issue name ${data.issues[i].name} for class assignment ${data.classAssignmentId}`,
                );

                const createNotificationRequestDto: CreateNotificationRequestDto = {
                    message: `Failed to generate content for issue name ${data.issues[i].name} for class assignment ${data.classAssignmentId}`,
                    eventType: ENotificationEventType.GENERATE_LESSON_FAILED,
                    classAssignmentId: data.classAssignmentId,
                };

                this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
                    createNotificationRequestDto,
                    accountId: data.accountId,
                });
            }

            this.logger.debug(
                `Finished generating content for issue ${i}/${data.issues.length} with class assignment ${data.classAssignmentId}`,
            );
        }

        this.logger.debug(
            `Finished generating issues with class assignment ${data.classAssignmentId}`,
        );

        const conclusionPrompt = await this.generateConclusionPromptDesign(
            data,
            JSON.stringify(lessonContent),
        );

        let conclusionResponse: ConclusionLessonDto = null;

        try {
            conclusionResponse = await this.chatService.sendMessageToModel(
                conclusionPrompt,
                this.temperature,
            );
        } catch (error) {
            this.logger.error(`Error while generating conclusion: ${error.message}`);

            const createNotificationRequestDto: CreateNotificationRequestDto = {
                message:
                    ((error.message || error || 'Generate conclusion failed') as string) +
                    `with class assignment id: ${data.classAssignmentId}`,
                eventType: ENotificationEventType.GENERATE_LESSON_FAILED,
                classAssignmentId: data.classAssignmentId,
            };

            this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
                createNotificationRequestDto,
                accountId: data.accountId,
            });
            return;
        }

        if (!conclusionResponse || !(await this.validateLessonConclusion(conclusionResponse))) {
            conclusionResponse = await this.retryGenerateLesson(
                conclusionResponse,
                conclusionPrompt,
                this.chatService.sendMessageToModel,
                this.validateLessonConclusion,
            );
        }

        this.logger.debug(
            `Finished generating conclusion with class assignment ${data.classAssignmentId}`,
        );

        if (conclusionResponse && (await this.validateLessonConclusion(conclusionResponse))) {
            lessonContent.conclusion = conclusionResponse;
        } else {
            this.logger.error(
                `Failed to generate conclusion response for class assignment ${data.classAssignmentId}`,
            );

            const createNotificationRequestDto: CreateNotificationRequestDto = {
                message: `Failed to generate conclusion response for class assignment ${data.classAssignmentId}`,
                eventType: ENotificationEventType.GENERATE_LESSON_FAILED,
                classAssignmentId: data.classAssignmentId,
            };

            this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
                createNotificationRequestDto,
                accountId: data.accountId,
            });
        }

        this.assignmentService.emit(ECommandLesson.SAVE_GENERATE_LESSON, {
            generateLessonRequestDto: data,
            lessonContent,
            accountId: data.accountId,
        });
    }

    async generateIntroductionPromptDesign(data: GenerateLessonRequestDto) {
        return `
            You will act as a teacher in education, especially English subject. With these list of issues identified in a class's assignment, help me create the introduction content for a lesson plan aimed at ${
                data.year
            } students. addresses the following issues:. 
            Help me prepare presentation content to put in a slide. The response should be in JSON format.
            List of issues identified in the class's assignment:
            ${JSON.stringify(data.issues)}

            Here is request from teacher ${data.prompt}.

            TO DO:
            - make sure the content is appropriate for ${data.year} students.
            - the content should be concise because this is the content we will put in a slide. not the words you will say.
            - Use simple language and examples to explain the concepts.
            - make sure the content is engaging and informative.
            - Construct an introduction at the beginning of the lesson that includes a brief overview of the topic, the importance of addressing these issues, and what students will learn by the end of the lesson.
            - The objectives should be clear and concise at at maximum 5 objectives.
            - The lesson should be follow the requested of teacher ${data.prompt}.
            
            Output in a JSON format like the following example:
            {
                "overview": "<overview of all issues in the class and address the overall severity of the class>",
                "objectives": [ "<list of objectives that students will learn by the end of the lesson>" ]
            }

            Output:
        `;
    }

    async validateLessonIntroduction(data: any) {
        const schema = {
            overview: 'string',
            objectives: 'array',
        };

        function validateSchema(obj, schema, path = '') {
            for (const key in schema) {
                const fullPath = path ? `${path}.${key}` : key;
                if (!obj.hasOwnProperty(key)) {
                    return `Missing property: ${fullPath}`;
                }
                const expectedType = schema[key];
                if (typeof expectedType === 'object') {
                    const result = validateSchema(obj[key], expectedType, fullPath);
                    if (result !== true) {
                        return result;
                    }
                } else if (expectedType === 'array') {
                    if (!Array.isArray(obj[key])) {
                        return `Expected array at: ${fullPath}`;
                    }
                } else if (typeof obj[key] !== expectedType) {
                    return `Expected ${expectedType} at: ${fullPath}, but got ${typeof obj[key]}`;
                }
            }
            return true;
        }

        const validationResult = validateSchema(data, schema);
        if (validationResult !== true) {
            this.logger.error(`Introduction validation failed: ${validationResult}`);
            return false;
        }

        return true;
    }

    async generateConclusionPromptDesign(data: GenerateLessonRequestDto, lessonContent: string) {
        return `
            You will act as a teacher in education, especially English subject. Given the lesson content provided, help me create the conclusion content for a lesson plan aimed at ${data.year} students. The lesson content includes the introduction and the main content of the lesson.
            Help me prepare presentation content to put in a slide. The response should be in JSON format.
            
            Lesson Content:
            ${lessonContent}

            Here is request from teacher ${data.prompt}.
            
            TO DO:
            - make sure the content is appropriate for ${data.year} students.
            - the content should be concise because this is the content we will put in a slide. not the words you will say.
            - Use simple language and examples to summarize the key points.
            - make sure the content is engaging and informative.
            - Construct a conclusion that includes a brief summary of the main points covered in the lesson,
            the importance of the topics discussed, and what students should take away from the lesson.
            - The takeaways should be brief and concise and numbers of takeaways must be at maximum 10 and at minimum 7.
            - The lesson should be follow the requested of teacher ${data.prompt}.

            Output in a JSON format like the following example:
            {
                "summary": "<brief summary of the main points covered in the lesson>",
                "takeaways": [ "<list of key takeaways for students>" ]
            }

            Output:
        `;
    }

    async validateLessonConclusion(data: any) {
        const schema = {
            summary: 'string',
            takeaways: 'array',
        };

        function validateSchema(obj, schema, path = '') {
            for (const key in schema) {
                const fullPath = path ? `${path}.${key}` : key;
                if (!obj.hasOwnProperty(key)) {
                    return `Missing property: ${fullPath}`;
                }
                const expectedType = schema[key];
                if (typeof expectedType === 'object') {
                    const result = validateSchema(obj[key], expectedType, fullPath);
                    if (result !== true) {
                        return result;
                    }
                } else if (expectedType === 'array') {
                    if (!Array.isArray(obj[key])) {
                        return `Expected array at: ${fullPath}`;
                    }
                } else if (typeof obj[key] !== expectedType) {
                    return `Expected ${expectedType} at: ${fullPath}, but got ${typeof obj[key]}`;
                }
            }
            return true;
        }

        const validationResult = validateSchema(data, schema);
        if (validationResult !== true) {
            this.logger.error(`Conclusion validation failed: ${validationResult}`);
            return false;
        }

        return true;
    }

    async generateLessonPerIssuesPromptDesign(data: GenerateLessonRequestDto, index: number) {
        return `As an English teacher, you're tasked with creating a concise and engaging slide presentation for ${
            data.year
        } students. This content is to address a specific issue identified in a previous assignment, suitable for a 15-minute lesson.
                Issue identified in the class's assignment:
                ${JSON.stringify(data.issues[index])}
                Help me prepare presentation content to put in a slide. The response should be in JSON format.

                Here is request from teacher ${data.prompt}.

                Please adhere to the following guidelines:
                - Ensure the language is age-appropriate and simple. If advanced terms are used, provide explanations in brackets immediately following the term.
                - The content should be engaging, informative, and appropriate for the specified student year.
                - Aim for conciseness, as this content will be displayed on slides.
                - The lesson should include these sections, each with at least three bullet points that offer main points, supporting statements, and examples:
                - The lesson should be follow the requested of teacher ${data.prompt}.

                1. **Main Issue with <issue_name>**
                    - Brief Description: Simple explanation of the issue
                    - Examples: Provide several examples (at minimum 3 and at maximum 5) of the issue
                    - Impacts: Describe the effects on students (at minimum 3 and at maximum 5) of the issue

                2. **When Does This <issue_name> Occur?**
                    - Symptoms: List signs indicating the issue (at minimum 3 and at maximum 5) of the issue
                    - Causes: Reasons behind the issue (at minimum 3 and at maximum 5) of the issue
                    - Consequences: Results from the issue (at minimum 3 and at maximum 5) of the issue

                3. **Solutions for <issue_name>**
                    - Solutions: Correct methods to address the issue (at minimum 3 and at maximum 5) of the issue
                    - Benefits: Advantages of applying the solutions (at minimum 3 and at maximum 5) of the issue
                    - Examples: Examples of the solutions in action (at minimum 3 and at maximum 5) of the issue

                The output should be formatted as a JSON object with escaped characters where necessary, and structured as shown below:

                {
                    "issue": "<Name of the issue as the header>",
                    "description": "<General trend with the issue>",
                    "content": [
                        {
                            "title": "Main Issue with <issue_name>",
                            "points": {
                                "Brief Description": "<Simple explanation>",
                                "Examples": [ "<list of examples>" ],
                                "Impacts": [ "<list of impacts>" ]
                            }
                        },
                        {
                            "title": "When Does This <issue_name> Occur?",
                            "points": {
                                "Symptoms": [ "<list of symptoms>" ],
                                "Causes": [ "<list of causes>" ],
                                "Consequences": [ "<list of consequences>" ]
                            }
                        },
                        {
                            "title": "Solutions for <issue_name>",
                            "points": {
                                "Solutions": [ "<list of solutions>" ],
                                "Benefits": [ "<list of benefits>" ],
                                "Examples": [ "<list of examples>" ]
                            }
                        }
                    ]
                }
        `;
    }

    async validateLessonPerIssues(data) {
        const schema = {
            issue: 'string',
            description: 'string',
            content: 'array',
        };

        function validateSchema(obj, schema, path = '') {
            for (const key in schema) {
                const fullPath = path ? `${path}.${key}` : key;
                if (!obj.hasOwnProperty(key)) {
                    return `Missing property: ${fullPath}`;
                }

                const expectedType = schema[key];
                const actualValue = obj[key];
                const actualType = Array.isArray(actualValue) ? 'array' : typeof actualValue;

                if (expectedType === 'array') {
                    if (!Array.isArray(actualValue)) {
                        return `Expected array at: ${fullPath}, but got ${actualType}`;
                    }
                    for (const item of actualValue) {
                        const result = validateSchema(item, expectedType, `${fullPath}[]`);
                        if (result !== true) {
                            return result;
                        }
                    }
                } else if (actualType !== expectedType) {
                    return `Expected ${expectedType} at: ${fullPath}, but got ${actualType}`;
                }
            }
            return true;
        }

        return validateSchema(data, schema);
    }

    @OnQueueCompleted()
    async onComplete(job: Job) {
        this.logger.info(`Job ${job.id} has completed.`);
    }

    @OnQueueFailed()
    async onFailed(job: Job, error: any) {
        this.logger.error(`Job ${job} has failed with error: ${error.message}`);
    }

    @OnQueueError()
    async onError(error: Error) {
        this.logger.error(`Generate lesson has error: ${error.message}`);
    }

    @OnQueueWaiting()
    async onWaiting(jobId: number) {
        this.logger.info(`Generate lesson is waiting for job ${jobId}`);
    }
}
