import { CommonConfigModule } from '@app/common/config/config.module';
import { FileModule } from '@app/common/file/file.module';
import { LoggerModule } from '@app/common/logger/logger/logger.module';
import { GlobalMicroserviceModule } from '@app/common/microservice-client/microservice.module';
import { prometheusModule } from '@app/common/prometheus/prometheus.config';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EConfig } from './config/interfaces/config.interface';
import { configuration, validationSchema } from './config/validate/config.validate';
import MODULES from './modules';
import { QuizAppController } from './quiz-app.controller';
import { QuizAppService } from './quiz-app.service';
import { DataSourceModule } from './shared/database/data-source.module';
import { DataSourceService } from './shared/database/data-source.service';

@Module({
    imports: [
        ...MODULES,
        CommonConfigModule,
        GlobalMicroserviceModule,
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['apps/quiz/.env'],
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
        prometheusModule('/metrics', 'quiz'),
    ],
    controllers: [QuizAppController],
    providers: [QuizAppService],
})
export class QuizAppModule {}
