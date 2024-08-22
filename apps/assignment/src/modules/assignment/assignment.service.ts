import { ELoggerService } from '@app/common/constants/service.constant';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import { PaginationResponseDto } from '@app/common/paginate/pagination-response.dto';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { GetAssignmentRequestDto } from 'apps/api/src/modules/assignment/dtos/get-assignment-request.dto';
import {
    GetAssignmentDetailResponseDto,
    GetAssignmentResponseDto,
    GetCriteriaLevelResponseDto,
    GetCriteriaResponseDto,
} from 'apps/api/src/modules/assignment/dtos/get-assignment-response.dto';
import { GetClassResponseDto } from 'apps/api/src/modules/class/dtos/get-class-response.dto';

import { AssignmentEntity } from './models/assignment.entity';
import { AssignmentRepository } from './models/assignment.repository';

@Injectable()
export class AssignmentService {
    constructor(
        private readonly assignmentRepo: AssignmentRepository,
        @Inject(ELoggerService.LOGGER_KEY)
        private readonly logger: ILogger,
    ) {}

    async getAssignmentDetail(
        id: number,
        userPayload: UserPayloadDto,
    ): Promise<GetAssignmentDetailResponseDto> {
        this.logger.info('Getting assignment detail', {
            prop: { id, userPayload },
        });

        let assignment: AssignmentEntity;

        try {
            assignment = await this.assignmentRepo.findOneWithDetails(id, userPayload.id);
        } catch (error) {
            this.logger.error(error);
            throw new RpcException({
                message: error.message || error || 'Error retrieving assignment',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'assignment-service-get-detail-error-#0001',
            });
        }

        if (!assignment) {
            throw new RpcException({
                message: 'Assignment not found or unauthorized',
                status: HttpStatus.NOT_FOUND,
                code: 'assignment-service-get-detail-error-#0002',
            });
        }

        const assignmentDetail: GetAssignmentDetailResponseDto =
            new GetAssignmentDetailResponseDto();

        assignmentDetail.id = assignment.id;
        assignmentDetail.name = assignment.name;
        assignmentDetail.year = assignment.year;
        assignmentDetail.classes = assignment.classAssignments.map(classAssignment => {
            const classDto = new GetClassResponseDto();
            classDto.id = classAssignment.class.id;
            classDto.name = classAssignment.class.name;
            classDto.subject = classAssignment.class.subject;
            classDto.year = classAssignment.class.year;
            classDto.classAssignmentId = classAssignment.id;
            return classDto;
        });
        assignmentDetail.criteria = assignment.criteria.map(criteria => {
            const criteriaDto = new GetCriteriaResponseDto();
            criteriaDto.id = criteria.id;
            criteriaDto.description = criteria.description;
            criteriaDto.criteriaLevels = criteria.criteriaLevels.map(criteriaLevel => {
                const criteriaLevelDto = new GetCriteriaLevelResponseDto();
                criteriaLevelDto.id = criteriaLevel.id;
                criteriaLevelDto.name = criteriaLevel.name;
                criteriaLevelDto.score = criteriaLevel.score;
                return criteriaLevelDto;
            });
            return criteriaDto;
        });
        return assignmentDetail;
    }

    async getAssignments(
        getAssignmentRequestDto: GetAssignmentRequestDto,
        userPayload: UserPayloadDto,
    ): Promise<PaginationResponseDto<GetAssignmentResponseDto>> {
        this.logger.info('Getting assignments', {
            prop: { getAssignmentRequestDto, userPayload },
        });

        let assignments: AssignmentEntity[];
        let total: number;

        try {
            [assignments, total] = await this.assignmentRepo.findMany(
                getAssignmentRequestDto,
                userPayload.id,
            );
        } catch (error) {
            this.logger.error(error);
            throw new RpcException({
                message: error.message || error || 'Error retrieving assignments',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'assignment-service-get-all-error-#0001',
            });
        }

        const assignmentDtos: GetAssignmentResponseDto[] = assignments.map(
            (assignment: AssignmentEntity) => {
                const assignmentDto = new GetAssignmentResponseDto();
                assignmentDto.id = assignment.id;
                assignmentDto.name = assignment.name;
                assignmentDto.year = assignment.year;
                return assignmentDto;
            },
        );

        return new PaginationResponseDto<GetAssignmentResponseDto>(
            assignmentDtos,
            getAssignmentRequestDto,
            total,
        );
    }
}
