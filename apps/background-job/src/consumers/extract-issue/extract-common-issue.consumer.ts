import { ECommandIssue, ECommandNotification } from '@app/common/constants/command.constant';
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
import { CreateIssueRequestDto } from 'apps/api/src/modules/issue/dtos/create-issue-request.dto';
import { CreateNotificationRequestDto } from 'apps/api/src/modules/notification/dtos/create-notification-request.dto';
import {
    IIssueModelResponse,
    ISupportData,
} from 'apps/assignment/src/modules/issue/issue.interface';
import { Job } from 'bull';

@Processor(EBullQueue.EXTRACT_ISSUE_QUEUE)
export class ExtractCommonIssueConsumer {
    private temperature = 0.2;
    constructor(
        @Inject(ELoggerService.LOGGER_KEY) private readonly logger: ILogger,
        @Inject(EChatService.CHAT_SERVICE)
        private readonly chatService: LanguageModelAbstract,
        @Inject(ERegisterMicroservice.ASSIGNMENT_SERVICE_RABBIT_MQ)
        private readonly assignmentService: ClientProxy,
        @Inject(ERegisterMicroservice.API_SERVICE_RABBIT_MQ)
        private readonly apiService: ClientProxy,
    ) {}

    @OnQueueActive()
    @Process({
        name: EBullQueueMessage.EXTRACT_COMMON_ISSUE_MESSAGE,
        concurrency: 3,
    })
    async onActive(job: Job) {
        this.logger.info(`Processing job ${job.id} of type ${job.name}.`);
        let commonIssues: CreateIssueRequestDto[];
        try {
            commonIssues = await this.extractCommonIssue(job.data.issues, job.data.supportData);
        } catch (error) {
            job.moveToFailed({ message: error.message }, true);

            const createNotificationRequestDto: CreateNotificationRequestDto = {
                message:
                    ((error.message || error || 'Error while extracting common issues') as string) +
                    `with class assignment id: ${job.data.classAssignmentId}`,
                eventType: ENotificationEventType.EXTRACT_ISSUE_FAILED,
                classAssignmentId: job.data.classAssignmentId,
            };

            this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
                createNotificationRequestDto,
                accountId: job.data.accountId,
            });
        }

        this.assignmentService.emit(ECommandIssue.SAVE_EXTRACTED_ISSUES, {
            issues: commonIssues,
            accountId: job.data.supportData.accountId,
        });

        return job.data;
    }

    @OnQueueCompleted()
    async onComplete(job: Job) {
        this.logger.info(`Job ${job.id} has completed.`);
    }

    @OnQueueFailed()
    async onFailed(job: Job, error: any) {
        this.logger.error(`Job ${job.id} has failed with error: ${error.message}`);
    }

    @OnQueueError()
    async onError(error: Error) {
        this.logger.error(`ExtractIssueConsumer has error: ${error.message}`);
    }

    @OnQueueWaiting()
    async onWaiting(jobId: number) {
        this.logger.info(`ExtractIssueConsumer is waiting for job ${jobId}`);
    }

    async extractCommonIssue(
        data: IIssueModelResponse[],
        supportData: ISupportData,
    ): Promise<CreateIssueRequestDto[]> {
        const prompt = await this.extractCommonIssuePromptDesign(data);
        let commonIssue: CreateIssueRequestDto[];

        try {
            const response = await this.chatService.sendMessageToModel(prompt, this.temperature);
            if (!this.validateModelResponse(response)) {
                throw new Error('Invalid response from model');
            }
            commonIssue = response.issues.map(issue => {
                const studentCount = Math.min(issue.studentCount, supportData.totalAssessment);
                const studentRate =
                    ((studentCount / supportData.totalAssessment) * 100).toFixed(2).toString() +
                    '%';

                const createdIssue: CreateIssueRequestDto = {
                    name: issue.name,
                    description: issue.description,
                    studentCount: studentCount,
                    studentRate: studentRate,
                    classAssignmentId: supportData.classAssignmentId,
                };

                return createdIssue;
            });
        } catch (error) {
            this.logger.error(error);
            throw new Error(`Error in extracting common issue: ${error.message}`);
        }

        return commonIssue;
    }

    async extractCommonIssuePromptDesign(data: IIssueModelResponse[]): Promise<string> {
        return `
            You will act as an expert in education, especially English subject. With these list of issues identified in students' essays, help me group issues into common issues.
            You will need to group similar and relevant issues together to be concise and not overlap and count the number of students who have each issue. 
            Please generalize the issues and provide a brief description of the issue and include 1-2 significant examples of such problems.
            Do not generate over 7 common issues, keep number of common issues equal or under 7.

            List of issues identified in individual students' essays:

            ${JSON.stringify(data)}

            TO DO:
            - Analyze the list of issues identified in individual students' essays.
            - Identify and generalise the common issues found in the class based on the list provided.
            - Issues identified should be grouped and general.
            - Try to group similar and relevant issues together to be concise and not overlap and count the number of students who have each issue.
            - With the description of each common issue identified, provide a brief description of the issue. In the description, you should include the impact of the issue on the students' learning and the possible causes of the issue. If possible, provide the symptoms, risks, consequences, and solutions to the issue. Also, include the benefits of solving the issue. And description must include 3-4 significant examples of such problems using the list provided.
            - Ensure that the description is clear and detailed with example.
            - Ensure that you do not provide more than 7 common issues.
            - Use British spelling, e.g., 'colour' instead of 'color' or 'realise' instead of 'realize'.
            

            Output in a JSON format like the following example:
            {
                "issues": [
                    {
                        "name": "<issue name>", 
                        "description": "<description text>", 
                        "studentCount": "<number_student_has_this_issue>"
                    }
                ]
            }

            Output:
        `;
    }

    async validateModelResponse(response) {
        if (typeof response !== 'object' || response === null || !Array.isArray(response.issues)) {
            return false;
        }
        if (response.issues.length === 0) {
            return false;
        }

        for (const issue of response.issues) {
            if (
                typeof issue.name !== 'string' ||
                typeof issue.description !== 'string' ||
                typeof issue.studentCount !== 'number'
            ) {
                return false;
            }
        }

        return true;
    }
}
