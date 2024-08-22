import { ECommandMail } from '@app/common/constants/command.constant';
import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';

import { UpdateMailRequestDto } from './dtos/update-mail-request.dto';
import { MailService } from './mail.service';

@Controller()
export class MailEvent {
    constructor(private readonly mailService: MailService) {}

    @EventPattern(ECommandMail.UPDATE_MAIL)
    async updateMailInDb(data: { mail: UpdateMailRequestDto }) {
        return await this.mailService.updateMailInDb(data);
    }
}
