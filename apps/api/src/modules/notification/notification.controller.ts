import { ECommonConfig } from '@app/common/config/interfaces/config.interface';
import { EApiRoute } from '@app/common/constants/route.constants';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { PaginationResponseDto } from '@app/common/paginate/pagination-response.dto';
import { RedisService } from '@app/common/redis/redis.service';
import { Body, Get, HttpStatus, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ApiSwaggerController } from '../../shared/decorators/api-class.decorator';
import { ApiSwaggerInfo } from '../../shared/decorators/api.decorator';
import { RestrictToTeacher } from '../../shared/decorators/permission.decorator';
import { UserPayload } from '../../shared/decorators/user-payload.decorator';
import { CreateNotificationRequestDto } from './dtos/create-notification-request.dto';
import { CreateNotificationResponseDto } from './dtos/create-notification-response.dto';
import { GetNotificationRequestDto } from './dtos/get-notification-request.dto';
import { GetNotificationResponseDto } from './dtos/get-notification-response.dto';
import { UpdateNotificationRequestDto } from './dtos/update-notification-request.dto';
import { UpdateNotificationResponseDto } from './dtos/update-notification-response.dto';
import { NotificationService } from './notification.service';

@ApiSwaggerController({
    name: EApiRoute.NOTIFICATION,
})
@RestrictToTeacher()
export class NotificationController {
    constructor(
        private readonly notificationService: NotificationService,
        private readonly redisService: RedisService,
        private readonly configService: ConfigService,
    ) {}
    @Post()
    @ApiSwaggerInfo({
        status: HttpStatus.CREATED,
        summary: 'Create a notification',
        response: CreateNotificationResponseDto,
    })
    async createNotification(
        @Body() createNotificationRequestDto: CreateNotificationRequestDto,
        @UserPayload() userPayload: UserPayloadDto,
    ) {
        return this.notificationService.createNotification(
            createNotificationRequestDto,
            userPayload.id,
        );
    }

    @Put(':id')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Update a notification',
        response: UpdateNotificationResponseDto,
    })
    async updateNotification(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateNotificationRequestDto: UpdateNotificationRequestDto,
        @UserPayload() userPayload: UserPayloadDto,
    ) {
        const cacheKey = `${EApiRoute.NOTIFICATION}_${userPayload.id}_`;
        await this.redisService.delPatternSpecific(cacheKey);

        return this.notificationService.updateNotification(
            id,
            updateNotificationRequestDto,
            userPayload.id,
        );
    }

    @Get()
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Get all notifications',
        response: PaginationResponseDto<GetNotificationResponseDto>,
    })
    async getNotifications(
        @Query() getNotificationRequestDto: GetNotificationRequestDto,
        @UserPayload() userPayload: UserPayloadDto,
    ) {
        const cacheKey = `${EApiRoute.NOTIFICATION}_${userPayload.id}_${JSON.stringify(
            getNotificationRequestDto,
        )}`;
        let response = await this.redisService.get(cacheKey);
        if (response) {
            return response;
        }

        response = await this.notificationService.getNotifications(
            getNotificationRequestDto,
            userPayload.id,
        );

        if (this.configService.get(ECommonConfig.IS_CACHE_ENABLE)) {
            this.redisService.set(cacheKey, response);
        }

        return response;
    }
}
