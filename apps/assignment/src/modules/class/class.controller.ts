import { ECommandClass } from '@app/common/constants/command.constant';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GetClassDetailResponseDto } from 'apps/api/src/modules/class/dtos/get-class-response.dto';

import { ClassService } from './class.service';

@Controller()
export class ClassController {
    constructor(private readonly classService: ClassService) {}

    @MessagePattern(ECommandClass.FIND_ONE_CLASS)
    async handleGetClassDetail(
        @Payload()
        data: {
            classAssignmentId: number;
            userPayload: UserPayloadDto;
        },
    ): Promise<GetClassDetailResponseDto> {
        return this.classService.getClassDetail(data);
    }
}
