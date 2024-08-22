import { ICommonConfig } from '../interfaces/config.interface';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Joi = require('joi');

export const commonConfiguration = (): ICommonConfig => ({
    NODE_ENV: process.env.NODE_ENV,
    ORGANIZATION: process.env.ORGANIZATION,

    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: parseInt(process.env.REDIS_PORT),
    REDIS_TTL: parseInt(process.env.REDIS_TTL),
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    REDIS_USERNAME: process.env.REDIS_USERNAME,
    IS_CACHE_ENABLE: true,

    RABBIT_MQ_HOST: process.env.RABBIT_MQ_HOST,
    RABBIT_MQ_PORT: parseInt(process.env.RABBIT_MQ_PORT),
    RABBIT_MQ_URL: `amqp://${process.env.RABBIT_MQ_HOST}:${process.env.RABBIT_MQ_PORT}`,

    STAGE_PATH: process.env.STAGE_PATH,
    IMAGE_SIZE_PIXEL: parseInt(process.env.IMAGE_SIZE_PIXEL),
    IMAGE_QUALITY: parseInt(process.env.IMAGE_QUALITY),

    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
    AWS_SECRET_KEY: process.env.AWS_SECRET_KEY,
    AWS_REGION: process.env.AWS_REGION,
    S3_IMAGE_PATH: process.env.S3_IMAGE_PATH,

    GPT4V_KEY: process.env.GPT4V_KEY,
    GPT4V_ENDPOINT: process.env.GPT4V_ENDPOINT,

    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: parseInt(process.env.SMTP_PORT),
    SMTP_USERNAME: process.env.SMTP_USERNAME,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,

    MAIL_ADMINISTRATOR: process.env.MAIL_ADMINISTRATOR,
    CLIENT_URL: process.env.CLIENT_URL,

    POSTMARK_API: process.env.POSTMARK_API,
    POSTMARK_SERVER_TOKEN: process.env.POSTMARK_SERVER_TOKEN,
    DEFAULT_MESSAGE_STREAM: process.env.DEFAULT_MESSAGE_STREAM,
    DEFAULT_SIGNATURE_EMAIL: process.env.DEFAULT_SIGNATURE_EMAIL,

    LESSON_S3_FOLDER: process.env.LESSON_S3_FOLDER,
    CHAT_S3_FOLDER: process.env.CHAT_S3_FOLDER,

    DEFAULT_LESSON_FILE_FORMAT: process.env.DEFAULT_LESSON_FILE_FORMAT,
    VECTOR_DB_ENDPOINT: process.env.VECTOR_DB_ENDPOINT,
    VECTOR_DB_API_KEY: process.env.VECTOR_DB_API_KEY,
    VECTOR_DB_API_VERSION: process.env.VECTOR_DB_API_VERSION,
    CHUNK_SIZE: parseInt(process.env.CHUNK_SIZE),
    CHUNK_OVERLAP: parseInt(process.env.CHUNK_OVERLAP),
    MAX_FILE_UPLOAD_LIMIT: parseInt(process.env.MAX_FILE_UPLOAD_LIMIT),
    GOOGLE_WEB_SEARCH_ENDPOINT: process.env.GOOGLE_WEB_SEARCH_ENDPOINT,
    GOOGLE_WEB_SEARCH_API_KEY: process.env.GOOGLE_WEB_SEARCH_API_KEY,
});

export const commonValidationSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),
    ORGANIZATION: Joi.string().required(),

    REDIS_HOST: Joi.string().required(),
    REDIS_PORT: Joi.number().required(),
    REDIS_TTL: Joi.number().required(),
    REDIS_PASSWORD: Joi.string().required(),
    REDIS_USERNAME: Joi.string().required(),
    IS_CACHE_ENABLE: Joi.boolean().required(),

    RABBIT_MQ_HOST: Joi.string().required(),
    RABBIT_MQ_PORT: Joi.number().required(),

    STAGE_PATH: Joi.string().required(),
    IMAGE_SIZE_PIXEL: Joi.number().required(),
    IMAGE_QUALITY: Joi.number().required(),

    S3_BUCKET_NAME: Joi.string().required(),
    AWS_ACCESS_KEY: Joi.string().required(),
    AWS_SECRET_KEY: Joi.string().required(),
    AWS_REGION: Joi.string().required(),
    S3_IMAGE_PATH: Joi.string().required(),

    GPT4V_KEY: Joi.string().required(),
    GPT4V_ENDPOINT: Joi.string().required(),

    SMTP_HOST: Joi.string().required(),
    SMTP_PORT: Joi.number().required(),
    SMTP_USERNAME: Joi.string().required(),
    SMTP_PASSWORD: Joi.string().required(),

    MAIL_ADMINISTRATOR: Joi.string().required(),
    CLIENT_URL: Joi.string().required(),

    POSTMARK_API: Joi.string().required(),
    POSTMARK_SERVER_TOKEN: Joi.string().required(),
    DEFAULT_MESSAGE_STREAM: Joi.string().required(),
    DEFAULT_SIGNATURE_EMAIL: Joi.string().required(),

    LESSON_S3_FOLDER: Joi.string().required(),
    CHAT_S3_FOLDER: Joi.string().required(),

    DEFAULT_LESSON_FILE_FORMAT: Joi.string().required(),
    VECTOR_DB_ENDPOINT: Joi.string().required(),
    VECTOR_DB_API_KEY: Joi.string().required(),
    VECTOR_DB_API_VERSION: Joi.string().required(),
    CHUNK_SIZE: Joi.number().required(),
    CHUNK_OVERLAP: Joi.number().required(),
    MAX_FILE_UPLOAD_LIMIT: Joi.number().required(),
    GOOGLE_WEB_SEARCH_ENDPOINT: Joi.string().required(),
    GOOGLE_WEB_SEARCH_API_KEY: Joi.string().required(),
});
