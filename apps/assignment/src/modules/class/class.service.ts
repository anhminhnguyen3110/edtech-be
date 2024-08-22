import { ECommonConfig } from '@app/common/config/interfaces/config.interface';
import { EFileService, ELoggerService } from '@app/common/constants/service.constant';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { FileService } from '@app/common/file/file.service';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { GetClassDetailResponseDto } from 'apps/api/src/modules/class/dtos/get-class-response.dto';

import { ClassAssignmentRepository } from '../assignment/models/class-assignment.repository';
import { MarkedAssessmentRepository } from '../issue/models/mark-assessment.repository';
import { ClassEntity } from './models/class.entity';
import { ClassRepository } from './models/class.repository';

@Injectable()
export class ClassService {
    constructor(
        private readonly classRepo: ClassRepository,
        private readonly classAssignmentRepo: ClassAssignmentRepository,
        private readonly markedAssessmentRepository: MarkedAssessmentRepository,
        @Inject(ELoggerService.LOGGER_KEY)
        private readonly logger: ILogger,

        private readonly configService: ConfigService,
        @Inject(EFileService.FILE_SERVICE)
        private readonly fileService: FileService,
    ) {}

    async getClassDetail(data: {
        classAssignmentId: number;
        userPayload: UserPayloadDto;
    }): Promise<GetClassDetailResponseDto> {
        const { classAssignmentId, userPayload } = data;
        this.logger.info('Getting class detail', {
            prop: { ...data },
        });

        const classAssignment = await this.classAssignmentRepo.findOne({
            where: {
                id: classAssignmentId,
            },
        });

        if (!classAssignment) {
            throw new RpcException({
                message: `Class assignment with id ${classAssignmentId} not found`,
                status: HttpStatus.NOT_FOUND,
                code: 'class-service-get-detail-error-#0001',
            });
        }

        if (classAssignment.accountId !== userPayload.id) {
            throw new RpcException({
                message: `Class assignment with id ${classAssignmentId} does not belong to user with id ${userPayload.id}`,
                status: HttpStatus.FORBIDDEN,
                code: 'class-service-get-detail-error-#0002',
            });
        }

        let classDetail: ClassEntity;
        try {
            classDetail = await this.classRepo.findOneWithDetails(
                classAssignment.id,
                userPayload.id,
            );
        } catch (error) {
            this.logger.error(error);
            throw new RpcException({
                message: error.message || 'Error retrieving class',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'class-service-get-detail-error-#0004',
            });
        }

        if (!classDetail) {
            throw new RpcException({
                message: `Class with id ${classAssignment.classId} not found`,
                status: HttpStatus.NOT_FOUND,
                code: 'class-service-get-detail-error-#0005',
            });
        }

        const [_, totalAssessment] = await this.markedAssessmentRepository.findByAssignmentAndClass(
            classAssignment.assignmentId,
            classAssignment.classId,
        );

        const classDetailResponse: GetClassDetailResponseDto = {
            id: classDetail.id,
            name: classDetail.name,
            subject: classDetail.subject,
            year: classDetail.year,
            classAssignmentId: classAssignmentId,
            totalAssessment: totalAssessment,
            issues: [],
            lessons: [],
        };

        const s3Folder = this.configService.get<string>(ECommonConfig.LESSON_S3_FOLDER);

        for (const classAssignment of classDetail.classAssignments) {
            classDetailResponse.issues.push(
                ...classAssignment.issues.map(issue => ({
                    id: issue.id,
                    name: issue.name,
                    studentCount: issue.studentCount,
                    studentRate: issue.studentRate,
                    description: issue.description,
                })),
            );

            for (const lesson of classAssignment.lessons) {
                const externalFilePath = `${s3Folder}/${lesson.id}/${lesson.name}.pptx`;
                const signedUrl = await this.fileService.getSignedUrl(externalFilePath);

                classDetailResponse.lessons.push({
                    id: lesson.id,
                    name: lesson.name,
                    fileUrl: signedUrl,
                    createdAt: lesson.createdAt,
                });
            }
        }

        return classDetailResponse;
    }
}
