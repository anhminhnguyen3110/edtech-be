import { EApiRoute } from '@app/common/constants/route.constants';
import { UserPayloadDto } from '@app/common/dtos/user-payload.dto';
import { PaginationResponseDto } from '@app/common/paginate/pagination-response.dto';
import { DocumentPipe } from '@app/common/pipe/document.pipe';
import {
    BadRequestException,
    Body,
    Delete,
    Get,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes } from '@nestjs/swagger';
import { extname } from 'path';

import { ApiSwaggerController } from '../../shared/decorators/api-class.decorator';
import { ApiSwaggerInfo } from '../../shared/decorators/api.decorator';
import { RestrictToTeacher } from '../../shared/decorators/permission.decorator';
import { UserPayload } from '../../shared/decorators/user-payload.decorator';
import { ChatService } from './chat.service';
import { CreateChatRequestDto } from './dtos/create-chat-request.dto';
import { CreateChatResponseDto } from './dtos/create-chat-response.dto';
import { DeleteChatResponseDto } from './dtos/delete-response.dto';
import {
    GetChatMessageRequestDto,
    GetChatTopicRequestDto,
    GetDocumentFromVectorDbRequestDto,
} from './dtos/get-chat-request.dto';
import { GetChatTopicResponseDto } from './dtos/get-chat-response.dto';
import { UpdateChatRequestDto } from './dtos/update-chat-request.dto';
import { UpdateChatResponseDto } from './dtos/update-chat-response.dto';

@ApiSwaggerController({
    name: EApiRoute.CHAT,
})
@RestrictToTeacher()
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    @Post()
    @ApiSwaggerInfo({
        status: HttpStatus.CREATED,
        summary: 'Get completion',
        response: CreateChatResponseDto,
    })
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(
        FileInterceptor('document', {
            fileFilter: (_, file, callback) => {
                const fileExtension = extname(file.originalname).toLowerCase();
                const allowedExtensions = ['.pdf'];
                if (!allowedExtensions.includes(fileExtension)) {
                    return callback(
                        new BadRequestException({
                            message: 'Invalid file type. Only PDF is allowed.',
                            statusCode: HttpStatus.BAD_REQUEST,
                            code: 'api-chat-controller-#0001',
                        }),
                        false,
                    );
                }
                callback(null, true);
            },
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB
            },
        }),
    )
    async createNewChatMessage(
        @Body() createChatRequestDto: CreateChatRequestDto,
        @UserPayload() userPayload: UserPayloadDto,
        @UploadedFile(DocumentPipe) file: any,
    ) {
        return this.chatService.createNewChatMessage(
            createChatRequestDto,
            userPayload,
            file.originalFileName,
            file.stageFilePath,
            file.s3StageFilePath,
        );
    }

    @Patch('/topics/:topic_id')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Get completion',
        response: UpdateChatResponseDto,
    })
    async updateChatMessage(
        @Param('topic_id', ParseIntPipe) topicId: number,
        @Body() createChatRequestDto: UpdateChatRequestDto,
        @UserPayload() userPayload: UserPayloadDto,
    ) {
        return this.chatService.updateChatTopic(topicId, createChatRequestDto, userPayload);
    }

    @Delete('/topics/:topic_id')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Get completion',
        response: DeleteChatResponseDto,
    })
    async deleteChatMessage(
        @Param('topic_id', ParseIntPipe) topicId: number,
        @UserPayload() userPayload: UserPayloadDto,
    ) {
        return this.chatService.deleteChatTopic(topicId, userPayload);
    }

    @Get('/topics')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Get chat topic',
        response: PaginationResponseDto<GetChatTopicResponseDto>,
    })
    async getChatTopic(
        @Query() getChatTopicRequestDto: GetChatTopicRequestDto,
        @UserPayload() userPayload: UserPayloadDto,
    ) {
        return this.chatService.getChatTopic(getChatTopicRequestDto, userPayload);
    }

    @Get('/topics/:topic_id')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Get chat topic by id',
        response: PaginationResponseDto<GetChatTopicResponseDto>,
    })
    async getChatMessage(
        @Param('topic_id', ParseIntPipe) topicId: number,
        @Query() getChatTopicDetailRequestDto: GetChatMessageRequestDto,
        @UserPayload() userPayload: UserPayloadDto,
    ) {
        return this.chatService.getChatMessage(topicId, getChatTopicDetailRequestDto, userPayload);
    }

    @Get('/vector-db')
    @ApiSwaggerInfo({
        status: HttpStatus.OK,
        summary: 'Get vector db',
    })
    async getVectorDb(
        @Query()
        getDocumentFromVectorDbRequestDto: GetDocumentFromVectorDbRequestDto,
        @UserPayload() userPayload: UserPayloadDto,
    ) {
        return this.chatService.getVectorDb(getDocumentFromVectorDbRequestDto, userPayload);
    }
}
