import { ETableName } from '@app/common/constants/table.constant';
import { BaseRepository } from '@app/common/database/base.repository';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { GetNotificationRequestDto } from '../dtos/get-notification-request.dto';
import { NotificationEntity } from './notification.entity';

@Injectable()
export class NotificationRepository extends BaseRepository<NotificationEntity> {
    constructor(private readonly dataSource: DataSource) {
        super(NotificationEntity, dataSource, ETableName.NOTIFICATION);
    }

    async getNotificationsPagination(
        getNotificationRequestDto: GetNotificationRequestDto,
        accountId: number,
    ): Promise<[NotificationEntity[], number]> {
        const qb = this.createQb();

        qb.where(`${this.alias}.accountId = :accountId`, {
            accountId,
        });

        this.qbPagination(qb, getNotificationRequestDto);

        return qb.getManyAndCount();
    }
}
