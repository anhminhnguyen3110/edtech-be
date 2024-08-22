export enum ELoggerService {
    LOGGER_KEY = 'LoggerService',
    WINSTON = 'Winston',
    BASE_LOGGER = 'BaseLogger',
    LOGGER_ADAPTER = 'LoggerAdapter',
    APP_NAME = 'APP_NAME',
}

export enum ERegisterMicroservice {
    API_SERVICE_RABBIT_MQ = 'API_SERVICE_RABBIT_MQ',
    ASSIGNMENT_SERVICE_RABBIT_MQ = 'ASSIGNMENT_SERVICE_RABBIT_MQ',
    QUIZ_SERVICE_RABBIT_MQ = 'QUIZ_SERVICE_RABBIT_MQ',
    BACKGROUND_JOB_SERVICE_RABBIT_MQ = 'BACKGROUND_JOB_SERVICE_RABBIT_MQ',
    CHAT_SERVICE_RABBIT_MQ = 'CHAT_SERVICE_RABBIT_MQ',
}

export enum EFileService {
    FILE_KEY = 'FileService',
    BASE_FILE_SERVICE = 'BaseFileService',
    FILE_SERVICE = 'FileService',
    S3_FILE_SERVICE = 'S3FileService',
}

export enum ECacheService {
    REDIS_CLIENT_KEY = 'RedisClient',
}

export enum EChatService {
    CHAT_SERVICE = 'ChatService',
    BASE_CHAT_SERVICE = 'BaseChatService',
}

export enum EMailService {
    BASE_MAIL_SERVICE = 'BaseMailService',
    MAIL_SERVICE = 'MailService',
    NODE_MAILER_SES = 'NODE_MAILER_SES',
    POSTMARK_CLIENT = 'POSTMARK_CLIENT',
}
