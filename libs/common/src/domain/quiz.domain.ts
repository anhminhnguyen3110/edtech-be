import { Question } from './question.domain';

export class Quiz {
    id: number;
    name: string;
    description: string;
    accountId: number;
    questions: Question[];
    classAssignmentId: number;
    createdAt: Date;
    updatedAt: Date;
}
