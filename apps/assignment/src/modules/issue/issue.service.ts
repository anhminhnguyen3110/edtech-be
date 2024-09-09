import { getJobConfig } from '@app/common/bull/bull.option';
import { ECommandNotification } from '@app/common/constants/command.constant';
import { EBullQueue, EBullQueueMessage } from '@app/common/constants/queue.constant';
import { EApiRoute } from '@app/common/constants/route.constants';
import { ELoggerService, ERegisterMicroservice } from '@app/common/constants/service.constant';
import { ENotificationEventType } from '@app/common/constants/ws.constant';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import { RedisService } from '@app/common/redis/redis.service';
import { InjectQueue } from '@nestjs/bull';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import {
    CreateIssueRequestDto,
    ExtractIssuesRequestDto,
} from 'apps/api/src/modules/issue/dtos/create-issue-request.dto';
import { CreateIssueResponseDto } from 'apps/api/src/modules/issue/dtos/create-issue-response.dto';
import { DeleteIssueResponseDto } from 'apps/api/src/modules/issue/dtos/delete-issue-response.dto';
import { GetIssueResponseDto } from 'apps/api/src/modules/issue/dtos/get-issue-response.dto';
import { UpdateIssueRequestDto } from 'apps/api/src/modules/issue/dtos/update-issue-request.dto';
import { UpdateIssueResponseDto } from 'apps/api/src/modules/issue/dtos/update-issue-response.dto';
import { CreateNotificationRequestDto } from 'apps/api/src/modules/notification/dtos/create-notification-request.dto';
import { Queue } from 'bull';

import { AssignmentEntity } from '../assignment/models/assignment.entity';
import { AssignmentRepository } from '../assignment/models/assignment.repository';
import { ClassAssignmentEntity } from '../assignment/models/class-assignment.entity';
import { ClassAssignmentRepository } from '../assignment/models/class-assignment.repository';
import { CriteriaLevelEntity } from '../assignment/models/criteria-level.entity';
import { CriteriaLevelRepository } from '../assignment/models/criteria-level.repository';
import { CriteriaEntity } from '../assignment/models/criteria.entity';
import { CriteriaRepository } from '../assignment/models/criteria.repository';
import {
    IAssessmentCriteria,
    IAssessmentDetails,
    IAssignmentDetails,
    IFetchAssessmentDetailsResult,
} from './issue.interface';
import { CriteriaMarkValueEntity } from './models/criteria-mark-value.entity';
import { CriteriaMarkValueRepository } from './models/criteria-mark-value.repository';
import { IssueEntity } from './models/issue.entity';
import { IssueRepository } from './models/issue.repository';
import { MarkedAssessmentEntity } from './models/mark-assessment.entity';
import { MarkedAssessmentRepository } from './models/mark-assessment.repository';

@Injectable()
export class IssueService {
    constructor(
        @Inject(ELoggerService.LOGGER_KEY)
        private readonly logger: ILogger,
        @InjectQueue(EBullQueue.EXTRACT_ISSUE_QUEUE)
        private readonly extractIssueQueue: Queue,
        @Inject(ERegisterMicroservice.API_SERVICE_RABBIT_MQ)
        private readonly apiService: ClientProxy,
        private readonly redisService: RedisService,

        // Repositories
        private readonly issueRepo: IssueRepository,
        private readonly classAssignmentRepo: ClassAssignmentRepository,
        private markedAssessmentRepo: MarkedAssessmentRepository,
        private criteriaRepo: CriteriaRepository,
        private criteriaLevelRepo: CriteriaLevelRepository,
        private criteriaMarkValueRepo: CriteriaMarkValueRepository,
        private assignmentRepo: AssignmentRepository,
    ) {}

    async createIssue(
        createIssueRequestDto: CreateIssueRequestDto,
        userPayload: UserPayloadDto,
    ): Promise<CreateIssueResponseDto> {
        this.logger.info('Creating issue', {
            prop: { createIssueRequestDto, userPayload },
        });

        let classAssignment: ClassAssignmentEntity;
        try {
            classAssignment = await this.classAssignmentRepo.findOne({
                where: {
                    id: createIssueRequestDto.classAssignmentId,
                },
            });
        } catch (error) {
            this.logger.error(error);
            throw new RpcException({
                message: error.message || error || 'Error finding class assignment',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'issue-service-create-error-#0001',
            });
        }

        if (!classAssignment) {
            throw new RpcException({
                message: 'Class assignment not found',
                status: HttpStatus.NOT_FOUND,
                code: 'issue-service-create-error-#0002',
            });
        }

        if (classAssignment.accountId !== userPayload.id) {
            throw new RpcException({
                message: 'Unauthorized',
                status: HttpStatus.UNAUTHORIZED,
                code: 'issue-service-create-error-#0003',
            });
        }

        let existedIssues: IssueEntity[];
        try {
            existedIssues = await this.issueRepo.find({
                where: {
                    classAssignmentId: createIssueRequestDto.classAssignmentId,
                },
            });
        } catch (error) {
            this.logger.error(error);
            throw new RpcException({
                message: error.message || error || 'Error finding issues',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'issue-service-create-error-#0004',
            });
        }

        if (existedIssues.length >= 10) {
            throw new RpcException({
                message: 'Maximum number of issues reached (10)',
                status: HttpStatus.BAD_REQUEST,
                code: 'issue-service-create-error-#0007',
            });
        }

        let issue: IssueEntity = new IssueEntity();
        issue.description = createIssueRequestDto.description;
        issue.studentCount = createIssueRequestDto.studentCount;
        issue.name = createIssueRequestDto.name;
        issue.classAssignmentId = createIssueRequestDto.classAssignmentId;

        const [_, totalAssessment]: [MarkedAssessmentEntity[], number] =
            await this.markedAssessmentRepo.findByAssignmentAndClass(
                classAssignment.assignmentId,
                classAssignment.classId,
            );

        if (totalAssessment === 0) {
            throw new RpcException({
                message: 'No marked assessments found',
                status: HttpStatus.NOT_FOUND,
                code: 'issue-service-create-error-#0004',
            });
        }

        if (issue.studentCount > totalAssessment) {
            throw new RpcException({
                message: 'Student count cannot be greater than total assessment',
                status: HttpStatus.BAD_REQUEST,
                code: 'issue-service-create-error-#0005',
            });
        }

        issue.studentRate =
            ((issue.studentCount / totalAssessment) * 100).toFixed(2).toString() + '%';

        try {
            issue = await this.issueRepo.save(issue);
        } catch (error) {
            this.logger.error(error);
            throw new RpcException({
                message: error.message || error || 'Error creating issue',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'issue-service-create-error-#0006',
            });
        }

        const classAssignmentCacheKey = `${EApiRoute.CLASS_ASSIGNMENT}_${userPayload.id}_${issue.classAssignmentId}`;
        await this.redisService.delPatternSpecific(classAssignmentCacheKey);

        const issueResponse: CreateIssueResponseDto = new CreateIssueResponseDto();
        issueResponse.id = issue.id;
        issueResponse.description = issue.description;
        issueResponse.studentCount = issue.studentCount;
        issueResponse.studentRate = issue.studentRate;
        issueResponse.name = issue.name;
        issueResponse.classAssignmentId = issue.classAssignmentId;

        return issueResponse;
    }

    async updateIssue(
        id: number,
        updateIssueRequestDto: UpdateIssueRequestDto,
        userPayload: UserPayloadDto,
    ): Promise<UpdateIssueResponseDto> {
        this.logger.info('Updating issue', {
            prop: { id, updateIssueRequestDto, userPayload },
        });

        let issue: IssueEntity;

        try {
            issue = await this.issueRepo.findOne({
                where: {
                    id,
                },
                relations: ['classAssignment'],
            });
        } catch (error) {
            this.logger.error(error);
            throw new RpcException({
                message: error.message || error || 'Error finding issue',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'issue-service-update-error-#0001',
            });
        }

        if (!issue) {
            throw new RpcException({
                message: 'Issue not found',
                status: HttpStatus.NOT_FOUND,
                code: 'issue-service-update-error-#0002',
            });
        }

        if (issue.classAssignment.accountId !== userPayload.id) {
            throw new RpcException({
                message: 'Unauthorized',
                status: HttpStatus.UNAUTHORIZED,
                code: 'issue-service-update-error-#0003',
            });
        }

        const [_, totalAssessment]: [MarkedAssessmentEntity[], number] =
            await this.markedAssessmentRepo.findByAssignmentAndClass(
                issue.classAssignment.assignmentId,
                issue.classAssignment.classId,
            );

        if (issue.studentCount !== updateIssueRequestDto.studentCount) {
            if (updateIssueRequestDto.studentCount > totalAssessment) {
                throw new RpcException({
                    message: 'Student count cannot be greater than total assessment',
                    status: HttpStatus.BAD_REQUEST,
                    code: 'issue-service-update-error-#0004',
                });
            }

            issue.studentRate =
                ((updateIssueRequestDto.studentCount / totalAssessment) * 100)
                    .toFixed(2)
                    .toString() + '%';
        }

        Object.assign(issue, updateIssueRequestDto);

        try {
            issue = await this.issueRepo.save(issue);
        } catch (error) {
            this.logger.error(error);
            throw new RpcException({
                message: error.message || error || 'Error updating issue',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'issue-service-update-error-#0004',
            });
        }

        const issueResponse: UpdateIssueResponseDto = new UpdateIssueResponseDto();
        issueResponse.id = issue.id;
        issueResponse.description = issue.description;
        issueResponse.studentCount = issue.studentCount;
        issueResponse.studentRate = issue.studentRate;
        issueResponse.name = issue.name;
        issueResponse.classAssignmentId = issue.classAssignmentId;

        const classAssignmentCacheKey = `${EApiRoute.CLASS_ASSIGNMENT}_${userPayload.id}_${issueResponse.classAssignmentId}`;
        await this.redisService.delPatternSpecific(classAssignmentCacheKey);

        return issueResponse;
    }

    async deleteIssue(id: number, userPayload: UserPayloadDto): Promise<DeleteIssueResponseDto> {
        this.logger.info('Deleting issue', {
            prop: { id, userPayload },
        });

        let issue: IssueEntity;

        try {
            issue = await this.issueRepo.findOne({
                where: {
                    id,
                },
                relations: ['classAssignment'],
            });
        } catch (error) {
            this.logger.error(error);
            throw new RpcException({
                message: error.message || error || 'Error finding issue',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'issue-service-delete-error-#0001',
            });
        }

        if (!issue) {
            throw new RpcException({
                message: 'Issue not found',
                status: HttpStatus.NOT_FOUND,
                code: 'issue-service-delete-error-#0002',
            });
        }

        if (issue.classAssignment.accountId !== userPayload.id) {
            throw new RpcException({
                message: 'Unauthorized',
                status: HttpStatus.UNAUTHORIZED,
                code: 'issue-service-delete-error-#0003',
            });
        }

        try {
            await this.issueRepo.delete(id);
        } catch (error) {
            this.logger.error(error);
            throw new RpcException({
                message: error.message || error || 'Error deleting issue',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'issue-service-delete-error-#0004',
            });
        }

        const classAssignmentCacheKey = `${EApiRoute.CLASS_ASSIGNMENT}_${userPayload.id}_${issue.classAssignmentId}`;
        await this.redisService.delPatternSpecific(classAssignmentCacheKey);

        const deleteResponse: DeleteIssueResponseDto = new DeleteIssueResponseDto();
        deleteResponse.message = 'Issue deleted successfully';
        return deleteResponse;
    }

    async getAllIssues(
        classAssignmentId: number,
        userPayload: UserPayloadDto,
    ): Promise<GetIssueResponseDto[]> {
        this.logger.info('Getting all issues', {
            prop: { classAssignmentId, userPayload },
        });

        let classAssignment: ClassAssignmentEntity;

        try {
            classAssignment = await this.classAssignmentRepo.findOne({
                where: {
                    id: classAssignmentId,
                },
            });
        } catch (error) {
            this.logger.error(error);
            throw new RpcException({
                message: error.message || error || 'Error finding class assignment',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'issue-service-get-all-error-#0001',
            });
        }

        if (!classAssignment) {
            throw new RpcException({
                message: 'Class assignment not found',
                status: HttpStatus.NOT_FOUND,
                code: 'issue-service-get-all-error-#0002',
            });
        }

        if (classAssignment.accountId !== userPayload.id) {
            throw new RpcException({
                message: 'Unauthorized',
                status: HttpStatus.UNAUTHORIZED,
                code: 'issue-service-get-all-error-#0003',
            });
        }

        let issues: IssueEntity[];

        try {
            issues = await this.issueRepo.find({
                where: {
                    classAssignmentId,
                },
            });
        } catch (error) {
            this.logger.error(error);
            throw new RpcException({
                message: error.message || error || 'Error retrieving issues',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'issue-service-get-all-error-#0004',
            });
        }

        return issues.map(issue => {
            const issueResponse: GetIssueResponseDto = new GetIssueResponseDto();
            issueResponse.id = issue.id;
            issueResponse.description = issue.description;
            issueResponse.studentCount = issue.studentCount;
            issueResponse.studentRate = issue.studentRate;
            issueResponse.name = issue.name;
            issueResponse.classAssignmentId = issue.classAssignmentId;

            return issueResponse;
        });
    }

    async extractIssues(data: {
        extractIssuesRequestDto: ExtractIssuesRequestDto;
        userPayload: UserPayloadDto;
    }): Promise<void> {
        this.logger.info('Extracting issues', {
            prop: { data },
        });

        const { extractIssuesRequestDto, userPayload } = data;

        const classAssignment = await this.classAssignmentRepo.findOne({
            where: {
                id: extractIssuesRequestDto.classAssignmentId,
            },
        });

        if (!classAssignment) {
            this.logger.warn(
                `Class assignment ${extractIssuesRequestDto.classAssignmentId} not found`,
            );

            const createNotificationRequestDto: CreateNotificationRequestDto = {
                message: `Class assignment ${extractIssuesRequestDto.classAssignmentId} not found when extracting issues`,
                eventType: ENotificationEventType.EXTRACT_ISSUE_FAILED,
                classAssignmentId: extractIssuesRequestDto.classAssignmentId,
            };

            this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
                createNotificationRequestDto,
                accountId: userPayload.id,
            });
            return;
        }

        if (classAssignment.accountId !== userPayload.id) {
            this.logger.warn(`Unauthorized access to class assignment ${classAssignment.id}`);

            const createNotificationRequestDto: CreateNotificationRequestDto = {
                message: `Unauthorized access to class assignment ${classAssignment.id} when extracting issues`,
                eventType: ENotificationEventType.EXTRACT_ISSUE_FAILED,
                classAssignmentId: extractIssuesRequestDto.classAssignmentId,
            };

            this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
                createNotificationRequestDto,
                accountId: userPayload.id,
            });
            return;
        }

        const issues = await this.issueRepo.find({
            where: {
                classAssignmentId: classAssignment.id,
            },
        });

        if (issues.length > 0) {
            this.logger.warn(`Issues already extracted for class assignment ${classAssignment.id}`);

            const createNotificationRequestDto: CreateNotificationRequestDto = {
                message: `Issues already extracted for class assignment ${classAssignment.id} when extracting issues`,
                eventType: ENotificationEventType.EXTRACT_ISSUE_FAILED,
                classAssignmentId: extractIssuesRequestDto.classAssignmentId,
            };

            this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
                createNotificationRequestDto,
                accountId: userPayload.id,
            });

            return;
        }

        const assignment: AssignmentEntity = await this.assignmentRepo.findOne({
            where: { id: classAssignment.assignmentId },
        });

        if (!assignment) {
            this.logger.warn(`Assignment ${classAssignment.assignmentId} not found`);

            const createNotificationRequestDto: CreateNotificationRequestDto = {
                message: `Assignment not found for class assignment ${classAssignment.id} when extracting issues`,
                eventType: ENotificationEventType.EXTRACT_ISSUE_FAILED,
                classAssignmentId: extractIssuesRequestDto.classAssignmentId,
            };

            this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
                createNotificationRequestDto,
                accountId: userPayload.id,
            });

            return;
        }

        const [markedAssessments, totalAssessment]: [MarkedAssessmentEntity[], number] =
            await this.markedAssessmentRepo.findByAssignmentAndClass(
                classAssignment.assignmentId,
                classAssignment.classId,
            );

        if (markedAssessments.length === 0) {
            this.logger.warn(
                `No marked assessments found for assignment ${classAssignment.assignmentId} and class ${classAssignment.classId}.`,
            );

            const createNotificationRequestDto: CreateNotificationRequestDto = {
                message: `No marked assessments found for classAssignment ${classAssignment.id} when extracting issues`,
                eventType: ENotificationEventType.EXTRACT_ISSUE_FAILED,
                classAssignmentId: extractIssuesRequestDto.classAssignmentId,
            };

            this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
                createNotificationRequestDto,
                accountId: userPayload.id,
            });

            return;
        }

        const criteria: CriteriaEntity[] = await this.criteriaRepo.find({
            where: { assignmentId: classAssignment.assignmentId },
        });

        const criteriaIds: number[] = criteria.map(c => c.id);

        const criteriaLevels: CriteriaLevelEntity[] =
            await this.criteriaLevelRepo.findByCriteriaIds(criteriaIds);

        const markedAssessmentIds: number[] = markedAssessments.map(ma => ma.id);
        const criteriaMarkValues: CriteriaMarkValueEntity[] =
            await this.criteriaMarkValueRepo.findByMarkedAssessments(markedAssessmentIds);

        const assessments: IAssessmentDetails[] = markedAssessments.map(assessment => {
            const assessmentCriteria: IAssessmentCriteria[] = criteriaMarkValues
                .filter(cmv => cmv.markedAssessmentId === assessment.id)
                .map(cmv => {
                    const level = criteriaLevels.find(cl => cl.id === cmv.criteriaLevelId);
                    const criterion = criteria.find(c => c.id === level.criteriaId);
                    return {
                        criteriaDescription: criterion.description,
                        levelName: level.name,
                        score: level.score,
                    };
                });

            return {
                id: assessment.id,
                extractedText: assessment.extractedText,
                feedback: assessment.feedback,
                criteria: assessmentCriteria,
            };
        });

        const assignmentDetails: IAssignmentDetails = {
            id: assignment.id,
            name: assignment.name,
            year: assignment.year,
            criteria: criteria.map(c => ({
                id: c.id,
                description: c.description,
            })),
        };

        const fetchAssessmentDetailsResult: IFetchAssessmentDetailsResult = {
            assignment: assignmentDetails,
            assessments,
            classId: classAssignment.classId,
            totalAssessment,
            classAssignmentId: classAssignment.id,
            accountId: userPayload.id,
        };

        this.logger.info(`Added job to extract issues for class assignment ${classAssignment.id}.`);

        this.extractIssueQueue.add(
            EBullQueueMessage.EXTRACT_MANY_ISSUES_MESSAGE,
            fetchAssessmentDetailsResult,
            getJobConfig(),
        );
    }

    async saveExtractedIssues(data: {
        accountId: number;
        issues: CreateIssueRequestDto[];
    }): Promise<void> {
        this.logger.info('Saving extracted issues', {
            prop: {
                accountId: data.accountId,
                classAssignmentId: data.issues[0].classAssignmentId,
            },
        });
        const { issues, accountId } = data;

        const existedIssues: IssueEntity[] = await this.issueRepo.find({
            where: {
                classAssignmentId: issues[0].classAssignmentId,
            },
        });

        if (existedIssues.length > 0) {
            this.logger.warn(
                `Issues already extracted for class assignment ${issues[0].classAssignmentId}`,
            );

            const createNotificationRequestDto: CreateNotificationRequestDto = {
                message: `Issues already extracted for class assignment ${issues[0].classAssignmentId}`,
                eventType: ENotificationEventType.EXTRACT_ISSUE_FAILED,
                classAssignmentId: issues[0].classAssignmentId,
            };

            this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
                createNotificationRequestDto,
                accountId,
            });

            return;
        }

        const queryRunner = this.issueRepo.createQueryRunner();
        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();

            for (const issue of issues) {
                const issueEntity = new IssueEntity();
                issueEntity.name = issue.name;
                issueEntity.description = issue.description;
                issueEntity.studentCount = issue.studentCount;
                issueEntity.studentRate = issue.studentRate;
                issueEntity.classAssignmentId = issue.classAssignmentId;

                try {
                    await this.issueRepo.save(issueEntity);
                } catch (error) {
                    this.logger.error(error);
                    await queryRunner.rollbackTransaction();
                    throw new RpcException({
                        message: error.message || error || 'Error saving issue',
                        status: HttpStatus.INTERNAL_SERVER_ERROR,
                        code: 'issue-service-save-error-#0001',
                    });
                }
            }

            await queryRunner.commitTransaction();
        } catch (error) {
            this.logger.error(error);
            await queryRunner.rollbackTransaction();
            const createNotificationRequestDto: CreateNotificationRequestDto = {
                message:
                    ((error.message || error || 'Error saving issues') as string) +
                    ` for class assignment ${issues[0].classAssignmentId}`,
                eventType: ENotificationEventType.EXTRACT_ISSUE_FAILED,
                classAssignmentId: issues[0].classAssignmentId,
            };

            this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
                createNotificationRequestDto,
                accountId,
            });
        } finally {
            await queryRunner.release();
        }

        const createNotificationRequestDto: CreateNotificationRequestDto = {
            message: `Issues extracted successfully for class assignment ${issues[0].classAssignmentId}`,
            eventType: ENotificationEventType.EXTRACT_ISSUE_SUCCESS,
            classAssignmentId: issues[0].classAssignmentId,
        };

        const classAssignmentCacheKey = `${EApiRoute.CLASS_ASSIGNMENT}_${accountId}_${issues[0].classAssignmentId}`;
        await this.redisService.delPatternSpecific(classAssignmentCacheKey);

        this.apiService.emit(ECommandNotification.CREATE_NOTIFICATION, {
            createNotificationRequestDto,
            accountId,
        });
    }
}
