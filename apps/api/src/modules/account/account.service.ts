import { ECommonConfig } from '@app/common/config/interfaces/config.interface';
import { EApiRoute } from '@app/common/constants/route.constants';
import { ELoggerService } from '@app/common/constants/service.constant';
import { ENotificationEventType } from '@app/common/constants/ws.constant';
import { Account } from '@app/common/domain/account.domain';
import { VerifiedPayloadDto } from '@app/common/dtos/user-payload.dto';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import { PaginationResponseDto } from '@app/common/paginate/pagination-response.dto';
import {
    BadRequestException,
    forwardRef,
    HttpStatus,
    Inject,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EConfig } from '../../config/interfaces/config.interface';
import { AuthService } from '../auth/auth.service';
import { CreateAccountActivationMailRequestDto } from '../mail/dtos/create-mail-request.dto';
import { MailService } from '../mail/mail.service';
import { CreateNotificationRequestDto } from '../notification/dtos/create-notification-request.dto';
import { NotificationService } from '../notification/notification.service';
import {
    CreateAccountRequestDto,
    ReactivateAccountRequestDto,
} from './dtos/create-account-request.dto';
import { CreateAccountResponseDto } from './dtos/create-account-response.dto';
import { GetAccountRequestDto } from './dtos/get-account-request.dto';
import { GetAccountResponseDto } from './dtos/get-account-response.dto';
import { AccountEntity } from './models/account.entity';
import { AccountRepository } from './models/account.repository';

@Injectable()
export class AccountService {
    constructor(
        private readonly accountRepo: AccountRepository,
        private readonly mailService: MailService,
        @Inject(forwardRef(() => AuthService))
        private readonly authService: AuthService,
        @Inject(ELoggerService.LOGGER_KEY) private readonly logger: ILogger,
        private readonly configService: ConfigService,
        private readonly notificationService: NotificationService,
    ) {}

    async activateAccount(verifiedToken: string): Promise<any> {
        const verifiedPayload: VerifiedPayloadDto = await this.authService.validateToken(
            verifiedToken,
        );

        let accountEntity: AccountEntity;
        try {
            accountEntity = await this.accountRepo.findOne({
                where: {
                    id: verifiedPayload.id,
                },
            });
        } catch (error) {
            throw new InternalServerErrorException({
                message: error.message || error || 'Internal server error',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'api-account-service-ts-activateAccount-error-#0001',
            });
        }

        if (!accountEntity) {
            throw new BadRequestException({
                message: 'Account not found',
                status: HttpStatus.BAD_REQUEST,
                code: 'api-account-service-ts-activateAccount-error-#0002',
            });
        }

        if (accountEntity.isActivated) {
            throw new BadRequestException({
                message: 'Account already activated',
                status: HttpStatus.BAD_REQUEST,
                code: 'api-account-service-ts-activateAccount-error-#0003',
            });
        }

        if (verifiedPayload.verifiedHash !== accountEntity.verifiedHash) {
            throw new BadRequestException({
                message: 'Invalid token',
                status: HttpStatus.BAD_REQUEST,
                code: 'api-account-service-ts-activateAccount-error-#0004',
            });
        }

        accountEntity.isActivated = true;
        accountEntity.verifiedHash = null;

        try {
            await this.accountRepo.save(accountEntity);
        } catch (error) {
            throw new InternalServerErrorException({
                message: error.message || error || 'Internal server error',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'api-account-service-ts-activateAccount-error-#0005',
            });
        }

        const createNotificationDto: CreateNotificationRequestDto = {
            message: `Account ${accountEntity.email} has been activated successfully`,
            eventType: ENotificationEventType.ACCOUNT_ACTIVATION_SUCCESS,
        };

        await this.notificationService.createNotification(createNotificationDto, accountEntity.id);

        return `Account ${accountEntity.email} has been activated successfully`;
    }

    async reactivateAccount(reactivateAccountDto: ReactivateAccountRequestDto) {
        this.logger.info('update verified token', {
            prop: {
                ...reactivateAccountDto,
            },
        });
        const { accountEmail } = reactivateAccountDto;

        let accountEntity: AccountEntity;

        try {
            accountEntity = await this.accountRepo.findOne({
                where: {
                    email: accountEmail,
                },
            });
        } catch (error) {
            throw new InternalServerErrorException({
                message: error.message || error || 'Internal server error',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'api-account-service-ts-updateVerifiedToken-error-#0001',
            });
        }

        if (!accountEntity) {
            throw new BadRequestException({
                message: 'Account not found',
                status: HttpStatus.BAD_REQUEST,
                code: 'api-account-service-ts-updateVerifiedToken-error-#0002',
            });
        }

        if (accountEntity.isActivated) {
            throw new BadRequestException({
                message: 'Account already activated',
                status: HttpStatus.BAD_REQUEST,
                code: 'api-account-service-ts-updateVerifiedToken-error-#0003',
            });
        }

        const { verifiedToken, verifiedHash } = await this.authService.generateVerifiedToken(
            accountEntity.email,
            accountEntity.id,
        );

        accountEntity.verifiedHash = verifiedHash;

        try {
            await this.accountRepo.save(accountEntity);
        } catch (error) {
            throw new InternalServerErrorException({
                message: error.message || error || 'Internal server error',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'api-account-service-ts-updateVerifiedToken-error-#0004',
            });
        }

        const serverHost = this.configService.get(EConfig.API_HOST);
        const serverPort = this.configService.get(EConfig.API_PORT);
        const prefix = this.configService.get(EConfig.API_PREFIX);
        const nodeEnv = this.configService.get(ECommonConfig.NODE_ENV);
        let activationLink;
        switch (nodeEnv) {
            case 'production':
                activationLink = `https://${serverHost}${prefix}/${EApiRoute.ACCOUNT}/activate-account?verifiedToken=${verifiedToken}`;
                break;
            case 'development':
                activationLink = `http://${serverHost}:${serverPort}${prefix}/${EApiRoute.ACCOUNT}/activate-account?verifiedToken=${verifiedToken}`;
                break;
            default:
                activationLink = `http://${serverHost}:${serverPort}${prefix}/${EApiRoute.ACCOUNT}/activate-account?verifiedToken=${verifiedToken}`;
                break;
        }
        const createMailRequestDto: CreateAccountActivationMailRequestDto = {
            to: accountEntity.email,
            activationLink: activationLink,
            verifiedToken: verifiedToken,
            userName: accountEntity.name,
            urlClient: this.configService.get(ECommonConfig.CLIENT_URL),
            expiredIn: this.configService.get(EConfig.VERIFIED_TOKEN_EXPIRES_IN),
        };

        await this.mailService.sendActivationAccountMail(createMailRequestDto);

        return {
            message: `An registration activation email has been sent to ${accountEntity.email}`,
            status: HttpStatus.OK,
        };
    }

    async getAccounts(
        getAccountsDto: GetAccountRequestDto,
        callFromClient = true,
    ): Promise<PaginationResponseDto<GetAccountResponseDto>> {
        try {
            const [accountEntities, total]: [AccountEntity[], number] =
                await this.accountRepo.getAccounts(getAccountsDto);

            const accounts = accountEntities.map(accountEntity => {
                const account = new GetAccountResponseDto();
                if (!callFromClient) {
                    Object.assign(account, accountEntity);
                } else {
                    account.id = accountEntity.id;
                    account.email = accountEntity.email;
                    account.name = accountEntity.name;
                    account.role = accountEntity.role;
                    account.isActivated = accountEntity.isActivated;
                }
                return account;
            });

            return new PaginationResponseDto<GetAccountResponseDto>(
                accounts,
                getAccountsDto,
                total,
            );
        } catch (error) {
            throw new InternalServerErrorException({
                message: error.message || error || 'Internal server error',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'api-account-service-ts-getAccounts-error-#0001',
            });
        }
    }

    async createAccount(
        createAccountDto: CreateAccountRequestDto,
        callFromClient = true,
    ): Promise<CreateAccountResponseDto> {
        if (
            createAccountDto.hashedPassword.length < 8 ||
            createAccountDto.hashedPassword.includes(' ')
        ) {
            throw new BadRequestException({
                message: 'Password must be at least 8 characters long and not contain spaces',
                status: HttpStatus.BAD_REQUEST,
                code: 'api-account-service-ts-createAccount-error-#0001',
            });
        }

        let existingAccount;
        try {
            existingAccount = await this.accountRepo.findOne({
                where: {
                    email: createAccountDto.email,
                },
            });
        } catch (error) {
            throw new InternalServerErrorException({
                message: error.message || error || 'Internal server error',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'api-account-service-ts-createAccount-error-#0002',
            });
        }

        if (existingAccount) {
            throw new BadRequestException({
                message: 'Email already exists',
                status: HttpStatus.BAD_REQUEST,
                code: 'api-account-service-ts-createAccount-error-#0003',
            });
        }

        const accountEntity = new AccountEntity();
        Object.assign(accountEntity, createAccountDto);
        accountEntity.isActivated = false;

        let response: CreateAccountResponseDto;
        let verifiedToken: string;
        let verifiedHash: string;
        try {
            let savedAccount = await this.accountRepo.save(accountEntity);

            ({ verifiedToken, verifiedHash } = await this.authService.generateVerifiedToken(
                savedAccount.email,
                savedAccount.id,
            ));

            accountEntity.verifiedHash = verifiedHash;
            savedAccount = await this.accountRepo.save(savedAccount);

            response = new CreateAccountResponseDto();
            if (!callFromClient) {
                Object.assign(response, savedAccount);
            } else {
                response.id = savedAccount.id;
                response.email = savedAccount.email;
                response.name = savedAccount.name;
                response.role = savedAccount.role;
                response.isActivated = savedAccount.isActivated;
            }
        } catch (error) {
            throw new InternalServerErrorException({
                message: error.message || error || 'Internal server error',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'api-account-service-ts-createAccount-error-#0004',
            });
        }

        const serverHost = this.configService.get(EConfig.API_HOST);
        const serverPort = this.configService.get(EConfig.API_PORT);
        const prefix = this.configService.get(EConfig.API_PREFIX);
        const nodeEnv = this.configService.get(ECommonConfig.NODE_ENV);

        let activationLink;
        switch (nodeEnv) {
            case 'production':
                activationLink = `https://${serverHost}${prefix}/${EApiRoute.ACCOUNT}/activate-account?verifiedToken=${verifiedToken}`;
                break;
            case 'development':
                activationLink = `http://${serverHost}:${serverPort}${prefix}/${EApiRoute.ACCOUNT}/activate-account?verifiedToken=${verifiedToken}`;
                break;
            default:
                activationLink = `http://${serverHost}:${serverPort}${prefix}/${EApiRoute.ACCOUNT}/activate-account?verifiedToken=${verifiedToken}`;
                break;
        }

        const createMailRequestDto: CreateAccountActivationMailRequestDto = {
            to: createAccountDto.email,
            activationLink: activationLink,
            verifiedToken: verifiedToken,
            userName: createAccountDto.name,
            urlClient: this.configService.get(ECommonConfig.CLIENT_URL),
            expiredIn: this.configService.get(EConfig.VERIFIED_TOKEN_EXPIRES_IN),
        };

        this.mailService.sendActivationAccountMail(createMailRequestDto);

        return response;
    }

    async getAccountById(id: Account['id'], callFromClient = true): Promise<GetAccountResponseDto> {
        try {
            const accountEntity = await this.accountRepo.findOne({
                where: { id },
            });

            if (!accountEntity) {
                return null;
            }

            const response = new GetAccountResponseDto();
            if (!callFromClient) {
                Object.assign(response, accountEntity);
            } else {
                response.id = accountEntity.id;
                response.email = accountEntity.email;
                response.name = accountEntity.name;
                response.role = accountEntity.role;
                response.isActivated = accountEntity.isActivated;
            }
            return response;
        } catch (error) {
            throw new InternalServerErrorException({
                message: error.message || error || 'Internal server error',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'api-account-service-ts-getAccountById-error-#0002',
            });
        }
    }

    async getAccountByEmail(
        email: Account['email'],
        callFromClient = true,
    ): Promise<GetAccountResponseDto | Account> {
        try {
            const accountEntity = await this.accountRepo.findOne({
                where: { email },
            });

            if (!accountEntity) {
                return null;
            }

            const response = new GetAccountResponseDto();
            if (!callFromClient) {
                Object.assign(response, accountEntity);
            } else {
                response.id = accountEntity.id;
                response.email = accountEntity.email;
                response.name = accountEntity.name;
                response.role = accountEntity.role;
                response.isActivated = accountEntity.isActivated;
            }
            return response;
        } catch (error) {
            throw new InternalServerErrorException({
                message: error.message,
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'api-account-service-ts-getAccountByEmail-error-#0002',
            });
        }
    }
}
