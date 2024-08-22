import { ECommandClass } from '@app/common/constants/command.constant';
import { ELoggerService, ERegisterMicroservice } from '@app/common/constants/service.constant';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { IErrorResponseDto } from '@app/common/interfaces/error.interface';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import { BadRequestException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';

import { GetClassDetailResponseDto } from './dtos/get-class-response.dto';

@Injectable()
export class ClassService {
    constructor(
        @Inject(ERegisterMicroservice.ASSIGNMENT_SERVICE_RABBIT_MQ)
        private readonly httpClient: ClientProxy,
        @Inject(ELoggerService.LOGGER_KEY)
        private readonly logger: ILogger,
    ) {}

    async getClassDetail(
        classAssignmentId: number,
        userPayload: UserPayloadDto,
    ): Promise<GetClassDetailResponseDto> {
        this.logger.info('Getting class detail', {
            prop: { classAssignmentId, userPayload },
        });

        try {
            const classDetail: GetClassDetailResponseDto = await firstValueFrom(
                this.httpClient
                    .send(ECommandClass.FIND_ONE_CLASS, {
                        classAssignmentId,
                        userPayload,
                    })
                    .pipe(timeout(3000)),
            );

            return classDetail;
        } catch (error) {
            throw new BadRequestException({
                message: error.message || error || 'Error getting class detail',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-class-service-get-detail-error-#0001',
            } as IErrorResponseDto);
        }
    }
}
