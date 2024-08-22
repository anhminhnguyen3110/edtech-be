import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DataSourceService } from './data-source.service';

@Module({
    providers: [ConfigService, DataSourceService],
    exports: [DataSourceService],
})
export class DataSourceModule {}
