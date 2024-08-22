import { ECommonConfig } from '@app/common/config/interfaces/config.interface';
import { EApiRoute } from '@app/common/constants/route.constants';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { RedisService } from '@app/common/redis/redis.service';
import { Get, HttpStatus, Param, ParseIntPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiSwaggerController } from '../../shared/decorators/api-class.decorator';
import { ApiSwaggerInfo } from '../../shared/decorators/api.decorator';
import { RestrictToTeacher } from '../../shared/decorators/permission.decorator';
import { UserPayload } from '../../shared/decorators/user-payload.decorator';
import { ClassService } from './class.service';
import { GetClassDetailResponseDto } from './dtos/get-class-response.dto';

@ApiSwaggerController({
    name: EApiRoute.CLASS_ASSIGNMENT,
})
@RestrictToTeacher()
export class ClassController {
    constructor(
        private readonly classService: ClassService,
        private readonly redisService: RedisService,
        private readonly configService: ConfigService,
    ) {}

    @Get('/:class_assignment_id')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Get class detail',
        response: GetClassDetailResponseDto,
    })
    async getClassDetail(
        @Param('class_assignment_id', ParseIntPipe) classAssignmentId: number,
        @UserPayload() userPayload: UserPayloadDto,
    ) {
        const cacheKey = `${EApiRoute.CLASS_ASSIGNMENT}_${userPayload.id}_${classAssignmentId}`;
        const cachedData = await this.redisService.get(cacheKey);
        if (cachedData) return cachedData; // Return cached data if available

        const response = await this.classService.getClassDetail(classAssignmentId, userPayload);

        if (this.configService.get(ECommonConfig.IS_CACHE_ENABLE)) {
            await this.redisService.set(cacheKey, response);
        }

        return response;
    }
}
