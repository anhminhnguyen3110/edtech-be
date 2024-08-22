import { ECommonConfig } from '@app/common/config/interfaces/config.interface';
import { EApiRoute } from '@app/common/constants/route.constants';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { PaginationResponseDto } from '@app/common/paginate/pagination-response.dto';
import { RedisService } from '@app/common/redis/redis.service';
import { Get, HttpStatus, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiSwaggerController } from '../../shared/decorators/api-class.decorator';
import { ApiSwaggerInfo } from '../../shared/decorators/api.decorator';
import { RestrictToTeacher } from '../../shared/decorators/permission.decorator';
import { UserPayload } from '../../shared/decorators/user-payload.decorator';
import { AssignmentService } from './assignment.service';
import { GetAssignmentRequestDto } from './dtos/get-assignment-request.dto';
import {
    GetAssignmentDetailResponseDto,
    GetAssignmentResponseDto,
} from './dtos/get-assignment-response.dto';

@ApiSwaggerController({
    name: EApiRoute.ASSIGNMENT,
})
@RestrictToTeacher()
export class AssignmentController {
    constructor(
        private readonly assignmentService: AssignmentService,
        private readonly redisService: RedisService,
        private readonly configService: ConfigService,
    ) {}

    @Get()
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Get all assignments',
        response: PaginationResponseDto<GetAssignmentResponseDto>,
    })
    async getAssignments(
        @Query() getAssignmentDto: GetAssignmentRequestDto,
        @UserPayload() userPayload: UserPayloadDto,
    ) {
        const cacheKey = `${EApiRoute.ASSIGNMENT}_${userPayload.id}_${JSON.stringify(
            getAssignmentDto,
        )}`;
        const cacheData = await this.redisService.get(cacheKey);
        if (cacheData) return cacheData;

        const response = await this.assignmentService.getAssignments(getAssignmentDto, userPayload);

        if (this.configService.get(ECommonConfig.IS_CACHE_ENABLE)) {
            await this.redisService.set(cacheKey, response);
        }

        return response;
    }

    @Get(':id')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Get assignment detail',
        response: GetAssignmentDetailResponseDto,
    })
    async getAssignmentDetail(
        @Param('id', ParseIntPipe) id: number,
        @UserPayload() userPayload: UserPayloadDto,
    ) {
        const cacheKey = `${EApiRoute.ASSIGNMENT}_${userPayload.id}_${id}`;
        const cacheData = await this.redisService.get(cacheKey);
        if (cacheData) return cacheData;

        const response = await this.assignmentService.getAssignmentDetail(id, userPayload);

        if (this.configService.get(ECommonConfig.IS_CACHE_ENABLE)) {
            await this.redisService.set(cacheKey, response);
        }

        return response;
    }
}
