import { CommonConfigModule } from '@app/common/config/config.module';
import { FileModule } from '@app/common/file/file.module';
import { LoggerModule } from '@app/common/logger/logger/logger.module';
import { GlobalMicroserviceModule } from '@app/common/microservice-client/microservice.module';
import { prometheusModule } from '@app/common/prometheus/prometheus.config';
import { RedisModule } from '@app/common/redis/redis.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { EConfig } from './config/interfaces/config.interface';
import { configuration, validationSchema } from './config/validate/config.validate';
import MODULES from './modules';
import { DataSourceModule } from './shared/database/data-source.module';
import { DataSourceService } from './shared/database/data-source.service';

@Module({
    imports: [
        ...MODULES,
        GlobalMicroserviceModule,
        CommonConfigModule,
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['apps/api/.env'],
            load: [configuration],
            validationSchema: validationSchema,
        }),
        TypeOrmModule.forRootAsync({
            imports: [DataSourceModule],
            inject: [DataSourceService],
            useFactory: async (dataSourceService: DataSourceService) => {
                return dataSourceService.getDataSourceOptions();
            },
        }),
        LoggerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
                return configService.get<string>(EConfig.APP_NAME);
            },
        }),
        FileModule,
        MulterModule.register(),
        RedisModule,
        prometheusModule('/metrics', 'api'),
    ],
    controllers: [ApiController],
    providers: [ApiService],
})
export class ApiModule {}
