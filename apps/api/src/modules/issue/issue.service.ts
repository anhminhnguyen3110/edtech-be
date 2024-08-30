import { ECommandIssue } from '@app/common/constants/command.constant';
import { ELoggerService, ERegisterMicroservice } from '@app/common/constants/service.constant';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { IErrorResponseDto } from '@app/common/interfaces/error.interface';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import { BadRequestException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';

import { CreateIssueRequestDto, ExtractIssuesRequestDto } from './dtos/create-issue-request.dto';
import { CreateIssueResponseDto, ExtractIssuesResponseDto } from './dtos/create-issue-response.dto';
import { DeleteIssueResponseDto } from './dtos/delete-issue-response.dto';
import { GetIssueResponseDto } from './dtos/get-issue-response.dto';
import { UpdateIssueRequestDto } from './dtos/update-issue-request.dto';
import { UpdateIssueResponseDto } from './dtos/update-issue-response.dto';

@Injectable()
export class IssueService {
    constructor(
        @Inject(ERegisterMicroservice.ASSIGNMENT_SERVICE_RABBIT_MQ)
        private readonly httpClient: ClientProxy,
        @Inject(ERegisterMicroservice.ASSIGNMENT_SERVICE_RABBIT_MQ)
        private readonly httpClientRabbitMQ: ClientProxy,
        @Inject(ELoggerService.LOGGER_KEY)
        private readonly logger: ILogger,
    ) {}

    async createIssue(
        createIssueRequestDto: CreateIssueRequestDto,
        userPayload: UserPayloadDto,
    ): Promise<CreateIssueResponseDto> {
        this.logger.info('Creating issue', {
            prop: {
                createIssueRequestDto,
                userPayload,
            },
        });

        try {
            const createdIssue: CreateIssueResponseDto = await firstValueFrom(
                this.httpClient
                    .send(ECommandIssue.CREATE_ISSUE, {
                        createIssueRequestDto,
                        userPayload,
                    })
                    .pipe(timeout(3000)),
            );

            return createdIssue;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error creating issue',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-issue-service-create-error-#0001',
            } as IErrorResponseDto);
        }
    }

    async updateIssue(
        id: number,
        updateIssueRequestDto: UpdateIssueRequestDto,
        userPayload: UserPayloadDto,
    ): Promise<UpdateIssueResponseDto> {
        this.logger.info('Updating issue', {
            prop: {
                id,
                updateIssueRequestDto,
                userPayload,
            },
        });

        try {
            const response: UpdateIssueResponseDto = await firstValueFrom(
                this.httpClient
                    .send(ECommandIssue.UPDATE_ISSUE, {
                        id,
                        updateIssueRequestDto,
                        userPayload,
                    })
                    .pipe(timeout(3000)),
            );

            return response;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error updating issue',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-issue-service-update-error-#0001',
            } as IErrorResponseDto);
        }
    }

    async deleteIssue(id: number, userPayload: UserPayloadDto): Promise<DeleteIssueResponseDto> {
        this.logger.info('Deleting issue', {
            prop: { id, userPayload },
        });

        try {
            return await firstValueFrom(
                this.httpClient
                    .send(ECommandIssue.REMOVE_ISSUE, {
                        id,
                        userPayload,
                    })
                    .pipe(timeout(3000)),
            );
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error deleting issue',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-issue-service-delete-error-#0001',
            } as IErrorResponseDto);
        }
    }

    async getAllIssues(
        classAssignmentId: number,
        userPayload: UserPayloadDto,
    ): Promise<GetIssueResponseDto[]> {
        this.logger.info('Getting all issues', {
            prop: { classAssignmentId, userPayload },
        });

        try {
            const issues: GetIssueResponseDto[] = await firstValueFrom(
                this.httpClient
                    .send(ECommandIssue.FIND_ALL_ISSUES, {
                        classAssignmentId,
                        userPayload,
                    })
                    .pipe(timeout(3000)),
            );

            return issues;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error getting all issues',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-issue-service-get-all-error-#0001',
            } as IErrorResponseDto);
        }
    }

    async extractIssues(
        extractIssuesRequestDto: ExtractIssuesRequestDto,
        userPayload: UserPayloadDto,
    ): Promise<ExtractIssuesResponseDto> {
        this.logger.info('Extracting issues', {
            prop: { extractIssuesRequestDto, userPayload },
        });

        try {
            this.httpClientRabbitMQ
                .emit(ECommandIssue.EXTRACT_ISSUES, {
                    extractIssuesRequestDto,
                    userPayload,
                })
                .pipe(timeout(3000));

            const response: ExtractIssuesResponseDto = {
                message:
                    'Extracting issues is being run in the background and might take 5-10 minutes, please wait. In the meantime, you can do other things.',
            };
            return response;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error extracting issues',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-issue-service-extract-error-#0001',
            } as IErrorResponseDto);
        }
    }
}
