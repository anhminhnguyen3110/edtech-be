import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

import { CommonConfigService } from './config.service';
import { commonConfiguration, commonValidationSchema } from './validate/config.validate';

@Module({
    imports: [
        NestConfigModule.forRoot({
            envFilePath: '.env',
            load: [commonConfiguration],
            validationSchema: commonValidationSchema,
        }),
    ],
    controllers: [],
    providers: [CommonConfigService],
    exports: [CommonConfigService],
})
export class CommonConfigModule {}
