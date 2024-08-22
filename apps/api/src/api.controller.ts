import { ECommandTest } from '@app/common/constants/command.constant';
import { ERegisterMicroservice } from '@app/common/constants/service.constant';
import { Get, HttpStatus, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { ApiService } from './api.service';
import { ApiSwaggerController } from './shared/decorators/api-class.decorator';
import { ApiSwaggerInfo } from './shared/decorators/api.decorator';

@ApiSwaggerController({ name: 'test' })
export class ApiController {
    constructor(
        @Inject(ERegisterMicroservice.ASSIGNMENT_SERVICE_RABBIT_MQ)
        private readonly assignmentService: ClientProxy,
        private readonly apiService: ApiService,
    ) {}

    @Get('assignment')
    @ApiSwaggerInfo({
        summary: 'This endpoint is used to test the ASSIGNMENT_APP service.',
        status: HttpStatus.OK,
        response: String,
    })
    async test() {
        return this.assignmentService.send(ECommandTest.TEST, {});
    }

    @Get('test-log')
    @ApiSwaggerInfo({
        summary: 'This endpoint is used to test the logger service.',
        status: HttpStatus.OK,
        response: String,
    })
    async testLog() {
        return await this.apiService.testLog();
    }
}
