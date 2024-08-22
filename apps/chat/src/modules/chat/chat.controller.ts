import { ECommandChat } from '@app/common/constants/command.constant';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { CreateChatRequestDto } from 'apps/api/src/modules/chat/dtos/create-chat-request.dto';
import {
    GetChatMessageRequestDto,
    GetChatTopicRequestDto,
    GetDocumentFromVectorDbRequestDto,
} from 'apps/api/src/modules/chat/dtos/get-chat-request.dto';
import { UpdateChatRequestDto } from 'apps/api/src/modules/chat/dtos/update-chat-request.dto';

import { ChatService } from './chat.service';

@Controller()
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    @MessagePattern(ECommandChat.CREATE_CHAT_MESSAGE)
    async createChatMessage(data: {
        createChatRequestDto: CreateChatRequestDto;
        userPayload: UserPayloadDto;
        originalFileName: string;
        stageFilePath: string;
        s3StageFilePath: string;
    }) {
        return this.chatService.createNewChatMessage(data);
    }

    @MessagePattern(ECommandChat.GET_CHAT_TOPIC)
    async getChatTopic(data: {
        getChatTopicRequestDto: GetChatTopicRequestDto;
        userPayload: UserPayloadDto;
    }) {
        return this.chatService.getChatTopic(data);
    }

    @MessagePattern(ECommandChat.GET_CHAT_MESSAGES)
    async getChatMessage(data: {
        topicId: number;
        getChatMessageRequestDto: GetChatMessageRequestDto;
        userPayload: UserPayloadDto;
    }) {
        return this.chatService.getChatMessage(data);
    }

    @MessagePattern(ECommandChat.UPDATE_CHAT_TOPIC)
    async updateChatTopic(data: {
        topicId: number;
        updateChatRequestDto: UpdateChatRequestDto;
        userPayload: UserPayloadDto;
    }) {
        return this.chatService.updateChatTopic(data);
    }

    @MessagePattern(ECommandChat.DELETE_CHAT_TOPIC)
    async deleteChatTopic(data: { topicId: number; userPayload: UserPayloadDto }) {
        return this.chatService.deleteChatTopic(data);
    }

    @MessagePattern(ECommandChat.GET_VECTOR_DB)
    async getDocumentFromVectorDb(data: {
        getDocumentFromVectorDbRequestDto: GetDocumentFromVectorDbRequestDto;
        userPayload: UserPayloadDto;
    }) {
        return this.chatService.getDocumentFromVectorDb(data);
    }
}
