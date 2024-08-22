import { EApiRoute } from '@app/common/constants/route.constants';

import { ApiSwaggerController } from '../../shared/decorators/api-class.decorator';
import { MailService } from './mail.service';

@ApiSwaggerController({ name: EApiRoute.MAIL })
export class MailController {
    constructor(private readonly _: MailService) {}
}
