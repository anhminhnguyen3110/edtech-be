import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';

import { EConfig } from '../../config/interfaces/config.interface';
import ENTITY from '../../modules/entity-index';

@Injectable()
export class DataSourceService {
    constructor(private readonly configService: ConfigService) {}

    public getDataSourceOptions(): DataSourceOptions {
        return {
            type: 'mysql',
            host: this.configService.get<string>(EConfig.DB_HOST),
            port: this.configService.get<number>(EConfig.DB_PORT, 3306),
            username: this.configService.get<string>(EConfig.DB_USERNAME),
            password: this.configService.get<string>(EConfig.DB_PASSWORD),
            database: this.configService.get<string>(EConfig.DB_NAME),
            synchronize: false,
            logging: false,
            entities: ENTITY,
        };
    }
}
