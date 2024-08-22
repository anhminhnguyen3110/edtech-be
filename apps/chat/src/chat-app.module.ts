import { CommonConfigModule } from '@app/common/config/config.module';
import { LoggerModule } from '@app/common/logger/logger/logger.module';
import { GlobalMicroserviceModule } from '@app/common/microservice-client/microservice.module';
import { prometheusModule } from '@app/common/prometheus/prometheus.config';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChatAppController } from './chat-app.controller';
import { ChatAppService } from './chat-app.service';
import { EConfig } from './config/interfaces/config.interface';
import { configuration, validationSchema } from './config/validate/config.validate';
import MODULES from './modules';
import { DataSourceModule } from './shared/database/data-source.module';
import { DataSourceService } from './shared/database/data-source.service';

@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            imports: [DataSourceModule],
            inject: [DataSourceService],
            useFactory: async (dataSourceService: DataSourceService) => {
                return dataSourceService.getDataSourceOptions();
            },
        }),
        GlobalMicroserviceModule,
        CommonConfigModule,
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['apps/chat/.env'],
            load: [configuration],
            validationSchema: validationSchema,
        }),
        LoggerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => {
                return configService.get<string>(EConfig.APP_NAME);
            },
        }),
        prometheusModule('/metrics', 'chat'),
        ...MODULES,
    ],
    controllers: [ChatAppController],
    providers: [ChatAppService],
})
export class ChatAppModule {}
