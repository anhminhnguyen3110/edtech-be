import { Module } from '@nestjs/common';

import { ClassController } from './class.controller';
import { ClassService } from './class.service';

@Module({
    controllers: [ClassController],
    providers: [ClassService],
})
export class ClassModule {}
