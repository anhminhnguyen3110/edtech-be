import { EApiRoute } from '@app/common/constants/route.constants';
import { ELoggerService } from '@app/common/constants/service.constant';
import { IErrorResponseDto } from '@app/common/interfaces/error.interface';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import { PaginationResponseDto } from '@app/common/paginate/pagination-response.dto';
import { RedisService } from '@app/common/redis/redis.service';
import {
    BadRequestException,
    HttpStatus,
    Inject,
    Injectable,
    InternalServerErrorException,
    UnauthorizedException,
} from '@nestjs/common';

import { CreateNotificationRequestDto } from './dtos/create-notification-request.dto';
import { CreateNotificationResponseDto } from './dtos/create-notification-response.dto';
import { GetNotificationRequestDto } from './dtos/get-notification-request.dto';
import { GetNotificationResponseDto } from './dtos/get-notification-response.dto';
import { UpdateNotificationRequestDto } from './dtos/update-notification-request.dto';
import { UpdateNotificationResponseDto } from './dtos/update-notification-response.dto';
import { NotificationEntity } from './models/notification.entity';
import { NotificationRepository } from './models/notification.repository';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
    constructor(
        @Inject(ELoggerService.LOGGER_KEY) private readonly logger: ILogger,
        private readonly notificationGateway: NotificationGateway,
        private readonly notificationRepo: NotificationRepository,
        private readonly redisService: RedisService,
    ) {}

    async getNotifications(
        getNotificationRequestDto: GetNotificationRequestDto,
        accountId: number,
    ): Promise<PaginationResponseDto<GetNotificationResponseDto>> {
        this.logger.info('Getting notifications', {
            prop: {
                getNotificationRequestDto,
                accountId: accountId,
            },
        });
        let notifications: NotificationEntity[], total: number;
        let numberOfUnreadNotifications: number;

        try {
            [notifications, total] = await this.notificationRepo.getNotificationsPagination(
                getNotificationRequestDto,
                accountId,
            );
        } catch (error) {
            throw new InternalServerErrorException({
                message: error.message || error || 'Error creating question',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-notification-service-get-notifications-#0001',
            } as IErrorResponseDto);
        }

        try {
            numberOfUnreadNotifications = await this.notificationRepo.count({
                where: {
                    accountId: accountId,
                    isRead: false,
                },
            });
        } catch (error) {
            throw new InternalServerErrorException({
                message: error.message || error || 'Error creating question',
                statusCode: error.status || HttpStatus.BAD_REQUEST,
                code: error.code || 'api-notification-service-get-notifications-#0002',
            } as IErrorResponseDto);
        }

        const getNotificationResponseDto: GetNotificationResponseDto[] = notifications.map(
            (notification: NotificationEntity) => {
                const getNotificationResponseDto: GetNotificationResponseDto = {
                    id: notification.id,
                    message: notification.message,
                    isRead: notification.isRead,
                    eventType: notification.eventType,
                    numberOfUnreadNotifications: numberOfUnreadNotifications,
                    classAssignmentId: notification.classAssignmentId,
                    accountId: notification.accountId,
                    createdAt: notification.createdAt,
                    updatedAt: notification.updatedAt,
                };
                return getNotificationResponseDto;
            },
        );

        const response: PaginationResponseDto<GetNotificationResponseDto> =
            new PaginationResponseDto<GetNotificationResponseDto>(
                getNotificationResponseDto,
                getNotificationRequestDto,
                total,
            );

        return response;
    }

    async createNotification(
        createNotificationRequestDto: CreateNotificationRequestDto,
        accountId: number,
    ): Promise<CreateNotificationResponseDto> {
        this.logger.info('Creating a new notification', {
            prop: {
                createNotificationRequestDto,
                accountId: accountId,
            },
        });

        const cacheKey = `${EApiRoute.NOTIFICATION}_${accountId}_`;
        await this.redisService.delPatternSpecific(cacheKey);

        try {
            this.notificationGateway.handleNotification(createNotificationRequestDto, accountId);
        } catch (error) {
            throw new InternalServerErrorException({
                message: error.message || 'Failed to create notification',
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'api-notification-service-create-notification-#0001',
            } as IErrorResponseDto);
        }

        const newNotification: NotificationEntity = new NotificationEntity();
        newNotification.message = createNotificationRequestDto.message;
        newNotification.accountId = accountId;
        newNotification.isRead = false;
        newNotification.eventType = createNotificationRequestDto.eventType;
        newNotification.classAssignmentId = createNotificationRequestDto.classAssignmentId;

        try {
            await this.notificationRepo.save(newNotification);
        } catch (error) {
            throw new InternalServerErrorException({
                message: error.message || 'Failed to create notification',
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'api-notification-service-create-notification-#0002',
            } as IErrorResponseDto);
        }

        const response: CreateNotificationResponseDto = {
            id: newNotification.id,
            message: newNotification.message,
            isRead: newNotification.isRead,
            eventType: newNotification.eventType,
            classAssignmentId: newNotification.classAssignmentId,
            accountId: newNotification.accountId,
            createdAt: newNotification.createdAt,
            updatedAt: newNotification.updatedAt,
        };
        return response;
    }

    async updateNotification(
        id: number,
        updateNotificationRequestDto: UpdateNotificationRequestDto,
        accountId: number,
    ): Promise<UpdateNotificationResponseDto> {
        this.logger.info('Updating notification', {
            prop: {
                id,
                updateNotificationRequestDto,
                accountId: accountId,
            },
        });

        let notification: NotificationEntity;
        try {
            notification = await this.notificationRepo.findOne({
                where: {
                    id,
                },
            });
        } catch (error) {
            throw new InternalServerErrorException({
                message: error.message || 'Failed to update notification',
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'api-notification-service-update-notification-#0001',
            } as IErrorResponseDto);
        }

        if (!notification) {
            throw new BadRequestException({
                message: 'Notification not found',
                statusCode: HttpStatus.NOT_FOUND,
                code: 'api-notification-service-update-notification-#0001',
            } as IErrorResponseDto);
        }

        if (notification.accountId !== accountId) {
            throw new UnauthorizedException({
                message: 'Unauthorized',
                statusCode: HttpStatus.UNAUTHORIZED,
                code: 'api-notification-service-update-notification-#0002',
            } as IErrorResponseDto);
        }

        Object.assign(notification, updateNotificationRequestDto);
        const updatedNotification = await this.notificationRepo.save(notification);

        const response: UpdateNotificationResponseDto = {
            id: updatedNotification.id,
            message: updatedNotification.message,
            isRead: updatedNotification.isRead,
            eventType: updatedNotification.eventType,
            classAssignmentId: updatedNotification.classAssignmentId,
            accountId: updatedNotification.accountId,
            createdAt: updatedNotification.createdAt,
            updatedAt: updatedNotification.updatedAt,
        };

        return response;
    }
}
