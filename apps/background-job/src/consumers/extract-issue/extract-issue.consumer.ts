import { getJobConfig } from '@app/common/bull/bull.option';
import { ECommandNotification } from '@app/common/constants/command.constant';
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
import { CreateNotificationRequestDto } from 'apps/api/src/modules/notification/dtos/create-notification-request.dto';
import {
    IFetchAssessmentDetailsResult,
    IIssueModelResponse,
    ISupportData,
} from 'apps/assignment/src/modules/issue/issue.interface';
import { Job, Queue } from 'bull';

@Processor(EBullQueue.EXTRACT_ISSUE_QUEUE)
export class ExtractIssueConsumer {
    private temperature = 0.2;
    constructor(
        @Inject(ELoggerService.LOGGER_KEY) private readonly logger: ILogger,
        @Inject(EChatService.CHAT_SERVICE)
        private readonly chatService: LanguageModelAbstract,
        @InjectQueue(EBullQueue.EXTRACT_ISSUE_QUEUE)
        private readonly queue: Queue,
        @Inject(ERegisterMicroservice.API_SERVICE_RABBIT_MQ)
        private readonly apiService: ClientProxy,
    ) {}

    @OnQueueActive()
    @Process({
        name: EBullQueueMessage.EXTRACT_MANY_ISSUES_MESSAGE,
        concurrency: 3,
    })
    async onActive(job: Job) {
        this.logger.info(`Processing job ${job.id} of type ${job.name}.`);
        const { data }: { data: IFetchAssessmentDetailsResult } = job;

        let issues: IIssueModelResponse[];
        try {
            issues = await this.extractIssueEachAssessment(data);
        } catch (error) {
            job.moveToFailed({ message: error.message }, true);
            const createNotificationRequestDto: CreateNotificationRequestDto = {
                message:
                    ((error.message || error || 'Error while extracting issues') as string) +
                    `with class assignment id: ${data.classAssignmentId}`,
                eventType: ENotificationEventType.EXTRACT_ISSUE_FAILED,
                classAssignmentId: data.classAssignmentId,
            };

            this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
                createNotificationRequestDto,
                accountId: data.accountId,
            });
            return;
        }

        const supportData: ISupportData = {
            totalAssessment: data.totalAssessment,
            classAssignmentId: data.classAssignmentId,
            accountId: data.accountId,
        };

        this.queue.add(
            EBullQueueMessage.EXTRACT_COMMON_ISSUE_MESSAGE,
            {
                issues,
                supportData,
            },
            getJobConfig(),
        );
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
        this.logger.error(`ExtractIssueConsumer has error: ${error.message}`);
    }

    @OnQueueWaiting()
    async onWaiting(jobId: number) {
        this.logger.info(`ExtractIssueConsumer is waiting for job ${jobId}`);
    }

    async extractIssuePromptDesign(assignmentObject, assessment) {
        return `
		As an experienced English teacher, your task is to locate and identify issues and weaknesses in students' essays based on the provided rubric. 
        Some essays will have scores already marked for a skill, while others will not. 
        If an essay has not been marked, you will need to read the essay and the rubric to determine the issues and weaknesses in the student's essay. 
        Ensure your comments cover a broad range of areas.
    
        Student Year Level: ${assignmentObject.year}
        Assignment Name: ${assignmentObject.name}
        Criteria: ${JSON.stringify(assignmentObject.criteria)}
    
        Student Essay: ${assessment.extractedText}
        Student Essay Feedback: ${assessment.feedback}
        Student Essay Criteria's Mark: ${JSON.stringify(assessment.criteria)}
    
        To do:
        - Locate and identify issues and weaknesses in students' essays based on the provided rubric.
        - Use a positive tone and be concise in describing the issues.
        - Write as if it is your own opinion, in the first person, as you are the teacher analyzing student performance.
        - Use the completed rubric and feedback to guide your comments on each criterion.
        - If the student's essay has not been marked, read the essay and the rubric to determine the issues and weaknesses in the student's essay.
        - Highlight only the important issues.
        - Issues identified should be based on the rubric and feedback.
        - In case of a missing score, use the rubric to determine the score.
        - Use British spelling, e.g., 'colour' instead of 'color' or 'realise' instead of 'realize'.
        - Issues identified should be grouped and general.
        - For each issue identified, provide a detailed and well-explained description of the issue and give an example of how the student demonstrates this issue and the example must be from the student's essay.
        - Extract the quoted text word for word.
        - Establish connections between the student's essay and their demonstration of skills and tags.
        - Be specific and concise. Limit your response to no more than one or two examples.
        - Ensure all quotes within JSON strings are escaped with a backslash (\), and validate the JSON format.
    
        Output in a JSON format like the following example in a list of pairs of issue name and description text:
        {
            "issues": [
                { 
                    "issue": "<issue name>", 
                    "description": "<description text>" 
                }
            ]
        }

        Output:
	`;
    }

    async validateIssueOutcome(output) {
        try {
            if (!output.issues) {
                return [false, "Validation Error: The 'issues' key is missing."];
            }

            if (!Array.isArray(output.issues)) {
                return [false, "Validation Error: 'issues' should be an array."];
            }

            for (const issue of output.issues) {
                if (typeof issue !== 'object' || issue === null) {
                    return [false, 'Validation Error: Each issue should be an object.'];
                }
                if (!issue.issue || typeof issue.issue !== 'string') {
                    return [
                        false,
                        "Validation Error: Each issue object must have an 'issue' key with a string value.",
                    ];
                }
            }

            return [true, 'Validation successful.'];
        } catch (error) {
            return [false, `Validation Error: Invalid JSON format. ${error.message}`];
        }
    }

    async extractIssueEachAssessment(
        data: IFetchAssessmentDetailsResult,
    ): Promise<IIssueModelResponse[]> {
        const { assignment, assessments, classId } = data;
        const issues: IIssueModelResponse[] = [];
        let index = 0;
        for (const assessment of assessments) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const issuePromptDesign = await this.extractIssuePromptDesign(assignment, assessment);

            let response: {
                issues: IIssueModelResponse[];
            };

            try {
                response = await this.chatService.sendMessageToModel(
                    issuePromptDesign,
                    this.temperature,
                );
            } catch (error) {
                this.logger.error(error);
                throw new Error(`Error while sending message to model: ${error.message}`);
            }
            this.logger.debug(`Processed assessment ${++index}/${assessments.length}`);
            const validationOutcome = await this.validateIssueOutcome(response);
            if (!validationOutcome[0]) {
                this.logger.error(`Validation Error: ${validationOutcome[1]}`);
                continue;
            }
            issues.push(
                ...response.issues.map(issue => ({
                    ...issue,
                    assessmentId: assessment.id,
                    totalAssessment: data.totalAssessment,
                })),
            );
        }

        this.logger.debug(
            `Processed all assessments with assignmentId: ${assignment.id} and classId: ${classId}`,
        );

        return issues;
    }
}
