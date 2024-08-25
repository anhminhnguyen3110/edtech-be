import { ENamespace } from '@app/common/constants/route.constants';
import { ELoggerService } from '@app/common/constants/service.constant';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import { forwardRef, Inject } from '@nestjs/common';
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { configuration } from '../../config/validate/config.validate';
import { AuthService } from '../auth/auth.service';
import { CreateNotificationRequestDto } from './dtos/create-notification-request.dto';

@WebSocketGateway(configuration().API_SOCKET_PORT, {
    namespace: ENamespace.NOTIFICATION,
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        @Inject(ELoggerService.LOGGER_KEY) private readonly logger: ILogger,
        @Inject(forwardRef(() => AuthService))
        private readonly authService: AuthService,
    ) {}

    @WebSocketServer()
    server: Server;

    async handleConnection(client: Socket) {
        let userPayload: UserPayloadDto;
        try {
            userPayload = await this.authService.validateToken(client.handshake.auth.token);
        } catch (error) {
            this.logger.error('Unauthorized Connection');
            client.disconnect();
            return;
        }

        if (!userPayload) {
            this.logger.error('Unauthorized Connection');
            client.disconnect();
            return;
        }

        this.logger.info(`NotificationGateway Connected: ${userPayload.id}`);
        client.join(userPayload.id.toString());
    }

    async handleDisconnect(client: Socket) {
        this.logger.info(`NotificationGateway Disconnected: ${client.id}`);
    }

    async handleNotification(data: CreateNotificationRequestDto, accountId: number) {
        this.logger.info(`NotificationGateway Emitting: ${data.eventType} to ${accountId}`);
        this.server.to(accountId.toString()).emit(data.eventType, data);
    }
}
