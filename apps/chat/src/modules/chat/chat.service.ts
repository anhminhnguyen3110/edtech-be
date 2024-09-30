import { ECommonConfig } from '@app/common/config/interfaces/config.interface';
import { EChatRole, IChatMessage, IChatPayload } from '@app/common/constants/chat.constant';
import { EChatService, EFileService, ELoggerService } from '@app/common/constants/service.constant';
import { EChatFileType } from '@app/common/constants/table.constant';
import { EVectorDbIndex } from '@app/common/constants/vector-db.constant';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { AFileService } from '@app/common/file/file.abstract';
import { LanguageModelAbstract } from '@app/common/language-model/language-model.abstract';
import { EModelDeployment } from '@app/common/language-model/language-model.interface';
import ILogger from '@app/common/logger/logger/interfaces/logger.interface';
import { PaginationResponseDto } from '@app/common/paginate/pagination-response.dto';
import {
    UserDocumentUploadInternalDto,
    VectorDbSearchRequestDto,
} from '@app/common/vectordb/dtos/vector-db-request.dto';
import {
    BaseDocumentResponseDto,
    EduDocumentResponseDto,
    UserDocumentResponseDto,
} from '@app/common/vectordb/dtos/vector-db-response-dto';
import { VectorDbService } from '@app/common/vectordb/vector-db-service';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { CreateChatRequestDto } from 'apps/api/src/modules/chat/dtos/create-chat-request.dto';
import { CreateChatResponseDto } from 'apps/api/src/modules/chat/dtos/create-chat-response.dto';
import { DeleteChatResponseDto } from 'apps/api/src/modules/chat/dtos/delete-response.dto';
import {
    GetChatMessageRequestDto,
    GetChatTopicRequestDto,
    GetDocumentFromVectorDbRequestDto,
} from 'apps/api/src/modules/chat/dtos/get-chat-request.dto';
import {
    GetChatFileResponseDto,
    GetChatMessageResponseDto,
    GetChatTopicResponseDto,
} from 'apps/api/src/modules/chat/dtos/get-chat-response.dto';
import { UpdateChatRequestDto } from 'apps/api/src/modules/chat/dtos/update-chat-request.dto';
import { UpdateChatResponseDto } from 'apps/api/src/modules/chat/dtos/update-chat-response.dto';
import { v4 as uuid4 } from 'uuid';

import { EConfig } from '../../config/interfaces/config.interface';
import {
    BaseDocumentResponseAdapterGoogleWebSearchDto,
    GoogleWebSearchResponseDto,
} from '../google-web-search/dtos/google-web-search.dto';
import { GoogleWebSearchService } from '../google-web-search/google-web-search.service';
import { ChatFileKeyEntity } from './models/chat-file-key.entity';
import { ChatMessageEntity } from './models/chat-message.entity';
import { ChatMessageRepository } from './models/chat-message.repository';
import { ChatTopicEntity } from './models/chat-topic.entity';
import { ChatTopicRepository } from './models/chat-topic.repository';

@Injectable()
export class ChatService {
    private readonly temperature: number = 0.3;
    constructor(
        @Inject(EChatService.CHAT_SERVICE)
        private readonly languageModelService: LanguageModelAbstract,
        @Inject(ELoggerService.LOGGER_KEY)
        private readonly logger: ILogger,
        @Inject(EFileService.FILE_SERVICE)
        private readonly fileService: AFileService,
        private readonly configService: ConfigService,
        private readonly vectorDbService: VectorDbService,
        private readonly googleWebSearchService: GoogleWebSearchService,

        // Repositories
        private readonly chatTopicRepo: ChatTopicRepository,
        private readonly chatMessageRepo: ChatMessageRepository,
    ) {}

    async createNewChatMessage(data: {
        createChatRequestDto: CreateChatRequestDto;
        userPayload: UserPayloadDto;
        originalFileName: string;
        stageFilePath: string;
        s3StageFilePath: string;
    }): Promise<CreateChatResponseDto> {
        this.logger.info('Enter microservice createNewChatMessage', {
            prop: {
                ...data,
            },
        });

        const {
            createChatRequestDto,
            userPayload,
            stageFilePath,
            originalFileName,
            s3StageFilePath,
        } = data;

        const queryRunner = await this.chatTopicRepo.getQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        let chatTopic: ChatTopicEntity;
        let fileSignedUrl: string;
        let isUsedWebSearch = 'false';
        let answer: string;
        let fusedUserDocs: UserDocumentResponseDto[] = [];
        let fusedEduDocs: EduDocumentResponseDto[] = [];
        let fusedWebDocs: BaseDocumentResponseAdapterGoogleWebSearchDto[] = [];
        let queries: string[];
        let nonArbitraryQuery: string;

        try {
            // Prepare chat topic
            if (!createChatRequestDto.topicId) {
                const totalChatTopics = await queryRunner.manager.count(ChatTopicEntity, {
                    where: { accountId: userPayload.id },
                });

                if (totalChatTopics >= this.configService.get<number>(EConfig.MAXIMUM_TOPIC)) {
                    throw new RpcException({
                        message: `User has reached maximum chat topic limit of ${this.configService.get<number>(
                            EConfig.MAXIMUM_TOPIC,
                        )}`,
                        status: HttpStatus.BAD_REQUEST,
                        code: 'chat-service-create-chat-message-error-#0001',
                    });
                }

                chatTopic = new ChatTopicEntity();
                chatTopic.accountId = userPayload.id;
                chatTopic.documentId = uuid4();
            } else {
                chatTopic = await queryRunner.manager.findOne(ChatTopicEntity, {
                    where: { id: createChatRequestDto.topicId },
                    relations: ['chatMessages', 'chatMessages.chatFileKey'],
                });

                if (!chatTopic) {
                    throw new RpcException({
                        message: 'Chat topic not found',
                        status: HttpStatus.NOT_FOUND,
                        code: 'chat-service-create-chat-message-error-#0002',
                    });
                }

                if (chatTopic.accountId !== userPayload.id) {
                    throw new RpcException({
                        message: 'Unauthorized access to chat topic',
                        status: HttpStatus.UNAUTHORIZED,
                        code: 'chat-service-create-chat-message-error-#0003',
                    });
                }

                if (
                    chatTopic.chatMessages.length >=
                    this.configService.get<number>(EConfig.MAXIMUM_MESSAGE)
                ) {
                    throw new RpcException({
                        message: `Chat topic has reached maximum chat message limit of ${this.configService.get<number>(
                            EConfig.MAXIMUM_MESSAGE,
                        )}`,
                        status: HttpStatus.BAD_REQUEST,
                        code: 'chat-service-create-chat-message-error-#0004',
                    });
                }
            }

            // Prepare chat message
            if (!chatTopic.chatMessages) {
                chatTopic.chatMessages = [];
            }

            const newUserChatMessage = new ChatMessageEntity();
            newUserChatMessage.message = createChatRequestDto.message;
            newUserChatMessage.role = EChatRole.USER;

            // Prepare chat file key
            if (stageFilePath && originalFileName) {
                // Check total file this user has uploaded
                const chatTopics: ChatTopicEntity[] = await queryRunner.manager.find(
                    ChatTopicEntity,
                    {
                        where: { accountId: userPayload.id },
                        relations: ['chatMessages', 'chatMessages.chatFileKey'],
                    },
                );

                const totalFiles = chatTopics
                    .map(chatTopic => chatTopic.chatMessages)
                    .flat()
                    .filter(chatMessage => chatMessage.chatFileKey).length;

                if (
                    totalFiles >=
                    this.configService.get<number>(ECommonConfig.MAX_FILE_UPLOAD_LIMIT)
                ) {
                    throw new RpcException({
                        message: 'User has reached maximum file upload limit',
                        status: HttpStatus.BAD_REQUEST,
                        code: 'chat-service-create-chat-message-error-#0004',
                    });
                }

                const chatFileKey = new ChatFileKeyEntity();
                chatFileKey.fileName = originalFileName;
                chatFileKey.fileCode = uuid4();
                const fileType = originalFileName.split('.').pop();
                switch (fileType) {
                    case 'pdf':
                        chatFileKey.fileType = EChatFileType.PDF;
                        break;
                    case 'docx':
                        chatFileKey.fileType = EChatFileType.DOCX;
                        break;
                    default:
                        chatFileKey.fileType = EChatFileType.PDF;
                        break;
                }

                try {
                    fileSignedUrl = await this.uploadFile(
                        s3StageFilePath,
                        stageFilePath,
                        originalFileName,
                        chatTopic.documentId,
                        chatFileKey.fileCode,
                    );
                } catch (error) {
                    this.logger.error(error);
                    throw new RpcException({
                        message: error.message || error || 'Error uploading file',
                        status: HttpStatus.INTERNAL_SERVER_ERROR,
                        code: 'chat-service-create-chat-message-error-#0005',
                    });
                }

                newUserChatMessage.chatFileKey = chatFileKey;
            }

            // Multi queries generation RAG technique
            nonArbitraryQuery = await this.createNonArbitraryQuery(
                createChatRequestDto.message,
                chatTopic.chatMessages,
                originalFileName,
            );

            queries = await this.generateSimilarQuery(nonArbitraryQuery, chatTopic.chatMessages);

            const userDocResults: UserDocumentResponseDto[][] = await Promise.all(
                queries.map(query =>
                    this.vectorDbService.searchDocument(
                        EVectorDbIndex.USER_DOCUMENT,
                        new VectorDbSearchRequestDto({
                            search: query,
                            count: false,
                            filter: `chat_topic_id eq '${chatTopic.documentId}'`,
                            isSemantic: true,
                        }),
                    ),
                ),
            );

            // Optional: Perform education document retrieval if necessary
            let eduResults: EduDocumentResponseDto[][] = [];
            if (
                (await this.isRetrievingEduKnowledge([
                    createChatRequestDto.message,
                    nonArbitraryQuery,
                ])) &&
                !s3StageFilePath
            ) {
                eduResults = await Promise.all(
                    queries.map(query =>
                        this.vectorDbService.searchDocument(
                            EVectorDbIndex.EDUCATION,
                            new VectorDbSearchRequestDto({
                                search: query,
                                count: false,
                                isSemantic: true,
                            }),
                        ),
                    ),
                );
            }

            this.logger.debug(`userResults Size: ${userDocResults.flat().length}`);
            this.logger.debug(`eduResults Size: ${eduResults.flat().length}`);

            const reciprocal_rank_fusion = (
                results: BaseDocumentResponseDto[][],
                k = 60,
            ): any[] => {
                const fusedScores: Record<string, number> = {};

                // Calculate fused scores
                for (const docs of results) {
                    for (const [rank, doc] of docs.entries()) {
                        const docStr = doc.id.toString();
                        if (!fusedScores[docStr]) {
                            fusedScores[docStr] = 0;
                        }
                        fusedScores[docStr] += 1 / (rank + k);
                    }
                }

                // Sort documents by their scores in descending order
                const sortedDocIds = Object.entries(fusedScores)
                    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
                    .map(([docStr]) => docStr);

                // Create a set of unique documents based on their id
                const uniqueDocs = new Set<BaseDocumentResponseDto>();

                for (const docId of sortedDocIds) {
                    for (const docs of results) {
                        const doc = docs.find(doc => doc.id.toString() === docId);
                        if (doc && !uniqueDocs.has(doc)) {
                            uniqueDocs.add(doc);
                            break;
                        }
                    }
                }

                return Array.from(uniqueDocs);
            };

            fusedUserDocs = reciprocal_rank_fusion(userDocResults);
            fusedEduDocs = reciprocal_rank_fusion(eduResults);
            fusedEduDocs = fusedEduDocs.slice(0, 5);
            fusedUserDocs = fusedUserDocs.slice(0, 10);

            let webAnswer: string;
            if (
                !fusedUserDocs.length &&
                (await this.isRetrieveWebKnowledge(createChatRequestDto.message, nonArbitraryQuery))
            ) {
                isUsedWebSearch = 'true';
                try {
                    const compositeQuery = [createChatRequestDto.message, nonArbitraryQuery].join(
                        '\n',
                    );

                    const response: GoogleWebSearchResponseDto =
                        await this.googleWebSearchService.search(compositeQuery);
                    webAnswer = response.answer;
                    fusedWebDocs = response.results.map(
                        result => new BaseDocumentResponseAdapterGoogleWebSearchDto(result),
                    );
                } catch (error) {
                    this.logger.error(error);
                    isUsedWebSearch = `I am trying to access internet but there is an error: ${
                        error.message || error || 'Error retrieving web search'
                    }`;
                }
            }

            const newAIChatMessage = new ChatMessageEntity();
            newAIChatMessage.role = EChatRole.ASSISTANT;

            answer = await this.answerChatMessage(
                createChatRequestDto.message,
                nonArbitraryQuery,
                fusedUserDocs,
                fileSignedUrl,
                originalFileName,
                fusedEduDocs,
                fusedWebDocs,
                webAnswer,
            );

            newAIChatMessage.message = answer;

            chatTopic.chatMessages.push(newUserChatMessage);
            chatTopic.chatMessages.push(newAIChatMessage);

            if (!createChatRequestDto.topicId) {
                chatTopic.topicName = await this.generateTopicName(nonArbitraryQuery, answer);
            }

            await queryRunner.manager.save(chatTopic);
            await queryRunner.commitTransaction();
        } catch (error) {
            this.logger.error(error);
            await queryRunner.rollbackTransaction();
            throw new RpcException({
                message: error.message || error || 'Error creating chat message',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'chat-service-create-chat-message-error-#0006',
            });
        } finally {
            await queryRunner.release();
        }

        return {
            chatTopicId: chatTopic.id,
            topicName: chatTopic.topicName,
            nonArbitraryQuery: nonArbitraryQuery,
            similarQueries: queries,
            answer: answer,
            isUsedWebSearch: isUsedWebSearch,
            fileName: originalFileName ? originalFileName : undefined,
            fileSignedUrl: fileSignedUrl ? fileSignedUrl : undefined,
            retrievedUserDocuments: [...fusedUserDocs],
            retrievedEduDocuments: [...fusedEduDocs],
            retrievedWebDocuments: [...fusedWebDocs],
        };
    }

    async uploadFile(
        s3StageFilePath: string,
        stageFilePath: string,
        originalFileName: string,
        chatTopicDocumentId: string,
        fileCode: string,
    ): Promise<string> {
        const targetPath = `${this.configService.get<string>(
            ECommonConfig.CHAT_S3_FOLDER,
        )}/${chatTopicDocumentId}/${fileCode}-${originalFileName}`;
        let fileSignedUrl: string;
        try {
            const fileStagedInLocal = await this.fileService.stageFileToLocal(
                s3StageFilePath,
                stageFilePath,
            );

            // vector db upload
            const userDocumentUploadRequestDto: UserDocumentUploadInternalDto =
                new UserDocumentUploadInternalDto({
                    title: originalFileName,
                    stageFilePath: fileStagedInLocal,
                    chatTopicId: chatTopicDocumentId,
                });

            await this.vectorDbService.uploadAndChunkDocument(
                EVectorDbIndex.USER_DOCUMENT,
                userDocumentUploadRequestDto,
            );

            fileSignedUrl = await this.fileService.updateFileName(s3StageFilePath, targetPath);
        } catch (error) {
            this.logger.error(error);
        } finally {
            await this.fileService.deleteStageFile(stageFilePath);
        }

        return fileSignedUrl;
    }

    async answerChatMessage(
        userPrompt: string,
        nonArbitraryUserPrompt: string,
        userContext: UserDocumentResponseDto[],
        fileUrl: string,
        fileName: string,
        eduContext: EduDocumentResponseDto[],
        webContext: BaseDocumentResponseAdapterGoogleWebSearchDto[],
        webAnswer: string,
    ): Promise<string> {
        // Clean the document contexts
        const cleanUserContext = userContext.map(doc => ({
            title: doc.title,
            document: doc.document,
        }));

        const cleanEduContext = eduContext.map(doc => ({
            title: doc.title,
            document: doc.document,
            url: doc.url,
        }));

        const cleanWebContext = webContext.map(doc => ({
            title: doc.title,
            document: doc.document,
            url: doc.url,
        }));

        const promptBuilder = `
            You are a helpful assistant that generates or answer a response based on the user's prompt and context. \n
            Sanitize your response and provide a helpful answer to the user. \n
            If there are no context provided, you do not need to generate References. \n
            You just cite the if the information is from context. \n
            Note that some context may not be relevant to the user's query. You can ignore them. \n
            Cite the appropriate references only if the user query related to the context, otherwise, you do not need to cite the References. \n
            Cite the references using markdown format [Title](url). \n
            Think step by step and provide a helpful answer. \n
            
            Generate or answer a response based on the following: \n
            User prompt: ${userPrompt} \n
            Context: \n
            ${
                userContext.length
                    ? `User document context: ${JSON.stringify(cleanUserContext, null, 2)} \n` +
                      `Here is the file name go with user's message: ${fileName} \n` +
                      `Here is the file url go with user's message: ${fileUrl} \n`
                    : ''
            }
            ${
                eduContext.length
                    ? `Education document context: ${JSON.stringify(cleanEduContext, null, 2)} \n`
                    : ''
            }
            ${
                webContext.length
                    ? `Web document context: ${JSON.stringify(cleanWebContext, null, 2)} \n`
                    : ''
            }
            ${webContext.length ? `This is the answer from the web: ${webAnswer} \n` : ''}

            Here is an example: 
            User prompt: What is the meaning of life?
            User document context: [{title: "The meaning of life", document: "The meaning of life is..."}]
            Education document context: [{title: "Philosophy of life", document: "The philosophy of life is..."}]
            Web document context: [{title: "Meaning of life", document: "The meaning of life is...", url: "https://en.wikipedia.org/wiki/Meaning_of_life"}]
            Answer: The meaning of life is...

            Now: \n
            Original User prompt: ${userPrompt}
            Non-arbitrary User prompt: ${nonArbitraryUserPrompt}
            Answer:
        `;

        const currentChat: IChatMessage = {
            role: EChatRole.USER,
            content: promptBuilder,
        };

        const payload: IChatPayload = {
            messages: [currentChat],
            temperature: 0.7,
        };

        return await this.languageModelService.getCompletion(payload, EModelDeployment.GPT4O_MINI);
    }

    async getChatTopic(data: {
        getChatTopicRequestDto: GetChatTopicRequestDto;
        userPayload: UserPayloadDto;
    }): Promise<PaginationResponseDto<GetChatTopicResponseDto>> {
        this.logger.info('Enter microservice getChatTopic', {
            prop: {
                ...data,
            },
        });

        const { getChatTopicRequestDto, userPayload } = data;
        let chatTopics: ChatTopicEntity[];
        let total: number;

        try {
            [chatTopics, total] = await this.chatTopicRepo.getChatTopicPagination(
                getChatTopicRequestDto,
                userPayload.id,
            );
        } catch (error) {
            throw new RpcException({
                message: error.message || error || 'Error retrieving chat topics',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'chat-service-get-chat-topic-error-#0001',
            });
        }

        const chatTopicResponses = chatTopics.map(chatTopic => {
            const chatTopicResponse = new GetChatTopicResponseDto();
            chatTopicResponse.id = chatTopic.id;
            chatTopicResponse.topicName = chatTopic.topicName;
            chatTopicResponse.updatedAt = chatTopic.updatedAt;
            return chatTopicResponse;
        });

        const response = new PaginationResponseDto<GetChatTopicResponseDto>(
            chatTopicResponses,
            getChatTopicRequestDto,
            total,
        );

        return response;
    }

    async isRetrievingEduKnowledge(queries: string[]): Promise<boolean> {
        const prompt = `
            You are a helpful assistant that identify the user's queries is related to any of 
                - education, 
                - quote from poet | drama | literature | poetry | novel | play | book | author | writer,
                - literature
                - novel
                - play
                - author
                - drama
                - poetry
                - subjects for study
                - english writing
                - teacher guide
                - student 
                - classroom management
                
            If any of them is yes return true, else return false. If you are unsure just return false.
            
            Here is user's prompt: <${queries.join('\n')}>.
			Here is an example of JSON output:
			{
                "isEduRelated": true
			}

			Output:
		`;

        const result = await this.languageModelService.sendMessageToModel(prompt, this.temperature);

        return result?.isEduRelated || false;
    }

    async isRetrieveWebKnowledge(originalQuery: string, query: string): Promise<boolean> {
        const currentYear = new Date().getFullYear();
        const prompt = `
            You are a helpful assistant tasked with determining whether the user's query requires retrieving information from the web/internet or requires the latest information from the web/internet.
            If you're unsure, or if the query involves current events, trending topics, or any data that might change frequently, return true.
            Additionally, if the query involves information that is not static and requires the latest information, return true.
            Additionally, if the query is related to the current year (${currentYear}) or this year, return true.
            Otherwise, if the information is static and can be answered with general knowledge, return false.
            
            Here is user's prompt: ${originalQuery}.
            Here is the query: ${query}.

            Here is an example of JSON output:
            {
                "isWebRelated": true
            }
            Output:
        `;

        const result = await this.languageModelService.sendMessageToModel(prompt, this.temperature);

        return result?.isWebRelated || false;
    }

    async createNonArbitraryQuery(
        userPrompt: string,
        previousChat: ChatMessageEntity[],
        fileName?: string,
    ): Promise<string> {
        const cleanPreviousChat = previousChat
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            .slice(0, 10)
            .map(chat => {
                return {
                    message: chat.message,
                    fileName: chat.chatFileKey?.fileName || undefined,
                };
            });

        const prompt = `
        You are a helpful assistant that generates a non-arbitrary query based on the user's prompt. \n
        Generate a non-arbitrary query based on: ${userPrompt} \n
        Here is the file go with user's message: ${fileName} \n
        If the query is ambiguous or non-context provided, you need to create more specific queries ${
            cleanPreviousChat.length
                ? `by using the previous chat messages: ${JSON.stringify(
                      cleanPreviousChat,
                      null,
                      2,
                  )} \n`
                : ''
        }
        If the query is specific please return the query as it is. \n
        Remain all request in the query. \n
        Remain all information in the query. \n

        Here is an example of JSON output: \n
        {
            "query": "What is the meaning of life?"
        }

        Output:`;

        const result = await this.languageModelService.sendMessageToModel(prompt, this.temperature);

        return result?.query || userPrompt;
    }

    async generateTopicName(userPrompt: string, modelResponse: string): Promise<string> {
        const prompt = `
        You are a helpful assistant that generates a topic name based on the user's prompt and model response. \n
        Generate a topic name based on: ${userPrompt} \n
        Here is the model response: ${modelResponse} \n
        Here is an example of JSON output: \n
        {
            "topicName": "What is the meaning of life?"
        }

        Output:`;

        const result = await this.languageModelService.sendMessageToModel(prompt, this.temperature);

        return result?.topicName || 'Chat Topic';
    }

    async generateSimilarQuery(
        userPrompt: string,
        previousChat: ChatMessageEntity[],
    ): Promise<string[]> {
        previousChat = previousChat.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        const cleanPreviousChat = previousChat
            .map(chat => {
                return {
                    message: chat.message,
                };
            })
            .slice(0, 10);
        const prompt = `
        You are an expert at world knowledge. Your task is to step back and paraphrase a question to a more generic step-back question, which is easier to answer. 
        Think step by step and provide step-back queries. \n
        Here are a few examples:
        - Original question: Which position did Knox Cunningham hold from May 1955 to Apr 1956?
        - Step-back question: Who is Knox Cunningham?
        - Step-back question: What did Knox Cunningham do?
        - Step-back question: What is Knox Cunningham known for?


        Now, generate multiple step back queries related to: ${userPrompt} \n
        Make sure there are only 4 queries. \n
        ${
            cleanPreviousChat.length
                ? `If the query is ambiguous or non-context provided, you need to create more specific queries by using the previous chat messages: ${JSON.stringify(
                      cleanPreviousChat,
                      null,
                      2,
                  )} \n`
                : ''
        }
        Here is an example of JSON output: \n
        {
            "queries": ["What is the meaning of life?", "What is the purpose of life?", "What is the reason for existence?", "What is the significance of life?"]
        }

        Output (4 queries):`;

        const result = await this.languageModelService.sendMessageToModel(prompt, this.temperature);

        if (!result?.queries) {
            return [userPrompt];
        } else {
            const lastQueries = result.queries.slice(0, 4);
            return [userPrompt, ...lastQueries];
        }
    }

    async getDocumentFromVectorDb(data: {
        getDocumentFromVectorDbRequestDto: GetDocumentFromVectorDbRequestDto;
        userPayload: UserPayloadDto;
    }) {
        this.logger.info('Enter microservice getDocumentFromVectorDb', {
            prop: {
                ...data,
            },
        });

        const { getDocumentFromVectorDbRequestDto, userPayload } = data;

        const { query, top, chatTopicId, index } = getDocumentFromVectorDbRequestDto;

        let chatTopic: ChatTopicEntity;

        try {
            chatTopic = await this.chatTopicRepo.findOne({
                where: {
                    id: chatTopicId,
                },
            });
        } catch (error) {
            throw new RpcException({
                message: error.message || error || 'Error retrieving chat topics',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'chat-service-get-chat-topic-error-#0001',
            });
        }

        if (!chatTopic) {
            throw new RpcException({
                message: 'Chat topic not found',
                status: HttpStatus.NOT_FOUND,
                code: 'chat-service-get-chat-topic-error-#0002',
            });
        }

        if (userPayload.id !== chatTopic.accountId) {
            throw new RpcException({
                message: 'Unauthorized access to chat topic',
                status: HttpStatus.UNAUTHORIZED,
                code: 'chat-service-get-chat-topic-error-#0003',
            });
        }

        let response: any;
        try {
            const searchRequestDto: VectorDbSearchRequestDto = new VectorDbSearchRequestDto({
                search: query,
                count: false,
                top: top,
                filter: chatTopicId ? `chat_topic_id eq '${chatTopic.documentId}'` : undefined,
                isSemantic: getDocumentFromVectorDbRequestDto.isSemantic,
            });

            response = await this.vectorDbService.searchDocument(index, searchRequestDto);
        } catch (error) {
            throw new RpcException({
                message: error.message || error || 'Error retrieving document from VectorDB',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'chat-service-get-document-from-vector-db-error-#0001',
            });
        }

        return response;
    }

    async getChatMessage(data: {
        topicId: number;
        getChatMessageRequestDto: GetChatMessageRequestDto;
        userPayload: UserPayloadDto;
    }): Promise<PaginationResponseDto<GetChatMessageResponseDto>> {
        this.logger.info('Enter microservice getChatMessage', {
            prop: {
                ...data,
            },
        });

        const { topicId, getChatMessageRequestDto, userPayload } = data;

        let chatTopic: ChatTopicEntity;

        try {
            chatTopic = await this.chatTopicRepo.findOne({
                where: {
                    id: topicId,
                },
            });
        } catch (error) {
            throw new RpcException({
                message: error.message || error || 'Error retrieving chat topics',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'chat-service-get-chat-topic-error-#0001',
            });
        }

        if (!chatTopic) {
            throw new RpcException({
                message: 'Chat topic not found',
                status: HttpStatus.NOT_FOUND,
                code: 'chat-service-get-chat-topic-error-#0002',
            });
        }

        if (chatTopic.accountId !== userPayload.id) {
            throw new RpcException({
                message: 'Unauthorized access to chat topic',
                status: HttpStatus.UNAUTHORIZED,
                code: 'chat-service-get-chat-topic-error-#0003',
            });
        }

        let chatMessages: ChatMessageEntity[];
        let total: number;

        try {
            [chatMessages, total] = await this.chatMessageRepo.getChatMessagePagination(
                topicId,
                getChatMessageRequestDto,
            );
        } catch (error) {
            throw new RpcException({
                message: error.message || error || 'Error retrieving chat messages',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'chat-service-get-chat-message-error-#0004',
            });
        }

        const getChatMessageResponses: GetChatMessageResponseDto[] = await Promise.all(
            chatMessages.map(async chatMessage => {
                const getChatMessageResponse = new GetChatMessageResponseDto();
                getChatMessageResponse.id = chatMessage.id;
                getChatMessageResponse.message = chatMessage.message;
                getChatMessageResponse.role = chatMessage.role;
                getChatMessageResponse.topicName = chatTopic.topicName;
                getChatMessageResponse.updatedAt = chatMessage.updatedAt;

                if (chatMessage.chatFileKey) {
                    getChatMessageResponse.file = new GetChatFileResponseDto();
                    getChatMessageResponse.file.id = chatMessage.chatFileKey.id;
                    getChatMessageResponse.file.fileName = chatMessage.chatFileKey.fileName;
                    getChatMessageResponse.file.fileType = chatMessage.chatFileKey.fileType;

                    const targetPath = `${this.configService.get<string>(
                        ECommonConfig.CHAT_S3_FOLDER,
                    )}/${chatTopic.documentId}/${chatMessage.chatFileKey.fileCode}-${
                        chatMessage.chatFileKey.fileName
                    }`;
                    getChatMessageResponse.file.fileUrl = await this.fileService.getSignedUrl(
                        targetPath,
                    );
                } else {
                    getChatMessageResponse.file = null;
                }

                return getChatMessageResponse;
            }),
        );

        const response = new PaginationResponseDto<GetChatMessageResponseDto>(
            getChatMessageResponses,
            getChatMessageRequestDto,
            total,
        );

        return response;
    }

    async deleteChatTopic(data: { topicId: number; userPayload: UserPayloadDto }) {
        this.logger.info('Enter microservice deleteChatTopic', {
            prop: {
                ...data,
            },
        });

        const { topicId, userPayload } = data;

        let topic: ChatTopicEntity;

        try {
            topic = await this.chatTopicRepo.findOne({
                where: {
                    id: topicId,
                },
            });
        } catch (error) {
            throw new RpcException({
                message: error.message || error || 'Error retrieving chat topics',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'chat-service-delete-chat-topic-error-#0001',
            });
        }

        if (topic.accountId !== userPayload.id) {
            throw new RpcException({
                message: 'Unauthorized access to chat topic',
                status: HttpStatus.UNAUTHORIZED,
                code: 'chat-service-delete-chat-topic-error-#0002',
            });
        }

        try {
            await this.chatTopicRepo.delete({
                id: topicId,
            });
        } catch (error) {
            throw new RpcException({
                message: error.message || error || 'Error deleting chat topic',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'chat-service-delete-chat-topic-error-#0003',
            });
        }

        const response: DeleteChatResponseDto = {
            message: 'Chat topic deleted successfully',
        };

        return response;
    }

    async updateChatTopic(data: {
        topicId: number;
        updateChatRequestDto: UpdateChatRequestDto;
        userPayload: UserPayloadDto;
    }) {
        this.logger.info('Enter microservice updateChatTopic', {
            prop: {
                ...data,
            },
        });

        const { topicId, updateChatRequestDto, userPayload } = data;

        let topic: ChatTopicEntity;

        try {
            topic = await this.chatTopicRepo.findOne({
                where: {
                    id: topicId,
                },
            });
        } catch (error) {
            throw new RpcException({
                message: error.message || error || 'Error retrieving chat topics',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'chat-service-update-chat-topic-error-#0001',
            });
        }

        if (topic.accountId !== userPayload.id) {
            throw new RpcException({
                message: 'Unauthorized access to chat topic',
                status: HttpStatus.UNAUTHORIZED,
                code: 'chat-service-update-chat-topic-error-#0002',
            });
        }

        topic.topicName = updateChatRequestDto.topicName;

        try {
            topic = await this.chatTopicRepo.save(topic);
        } catch (error) {
            throw new RpcException({
                message: error.message || error || 'Error updating chat topic',
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'chat-service-update-chat-topic-error-#0003',
            });
        }

        const response: UpdateChatResponseDto = new UpdateChatResponseDto();

        response.message = 'Chat topic updated successfully';
        response.chatTopicId = topic.id;
        response.chatTopicName = topic.topicName;

        return response;
    }
}
