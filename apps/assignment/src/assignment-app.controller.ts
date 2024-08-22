import { Controller } from '@nestjs/common';

import { AssignmentAppService } from './assignment-app.service';

@Controller('assignment-app')
export class AssignmentAppController {
    constructor(private readonly assignmentAppService: AssignmentAppService) {}
}
