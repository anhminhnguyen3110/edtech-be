import { IChatPayload } from '../constants/chat.constant';
import { EModelDeployment } from './language-model.interface';

export abstract class LanguageModelAbstract {
    abstract getCompletion(payload: IChatPayload, deployment?: EModelDeployment): Promise<any>;
    abstract sendMessageToModel(prompt: string, temperature?: number): Promise<any>;
}
