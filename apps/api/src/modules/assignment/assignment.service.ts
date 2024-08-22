import { ECommandAssignment } from '@app/common/constants/command.constant';
import { ELoggerService, ERegisterMicroservice } from '@app/common/constants/service.constant';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { IErrorResponseDto } from '@app/common/interfaces/error.interface';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import { PaginationResponseDto } from '@app/common/paginate/pagination-response.dto';
import { BadRequestException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';

import { GetAssignmentRequestDto } from './dtos/get-assignment-request.dto';
import {
    GetAssignmentDetailResponseDto,
    GetAssignmentResponseDto,
} from './dtos/get-assignment-response.dto';

@Injectable()
export class AssignmentService {
    constructor(
        @Inject(ERegisterMicroservice.ASSIGNMENT_SERVICE_RABBIT_MQ)
        private readonly httpClient: ClientProxy,
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

        try {
            const assignmentDetail: GetAssignmentDetailResponseDto = await firstValueFrom(
                this.httpClient
                    .send(ECommandAssignment.FIND_ONE_ASSIGNMENT, {
                        id,
                        userPayload,
                    })
                    .pipe(timeout(3000)),
            );

            return assignmentDetail;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error getting assignment detail',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-assignment-service-get-detail-error-#0001',
            } as IErrorResponseDto);
        }
    }

    async getAssignments(
        getAssignmentRequestDto: GetAssignmentRequestDto,
        userPayload: UserPayloadDto,
    ): Promise<PaginationResponseDto<GetAssignmentResponseDto>> {
        this.logger.info('Getting assignments', {
            prop: { getAssignmentRequestDto, userPayload },
        });

        try {
            const assignments: PaginationResponseDto<GetAssignmentResponseDto> =
                await firstValueFrom(
                    this.httpClient
                        .send(ECommandAssignment.FIND_ALL_ASSIGNMENTS, {
                            getAssignmentRequestDto,
                            userPayload,
                        })
                        .pipe(timeout(3000)),
                );
            return assignments;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error getting assignments',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-assignment-service-get-assignments-error-#0001',
            } as IErrorResponseDto);
        }
    }
}
