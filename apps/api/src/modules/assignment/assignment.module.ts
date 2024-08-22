import { Module } from '@nestjs/common';

import { AssignmentController } from './assignment.controller';
import { AssignmentService } from './assignment.service';

@Module({
    controllers: [AssignmentController],
    providers: [AssignmentService],
})
export class AssignmentModule {}
