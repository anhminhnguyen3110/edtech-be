import { AccountModule } from './account/account.module';
import { AssignmentModule } from './assignment/assignment.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { ClassModule } from './class/class.module';
import { GameModule } from './game/game.module';
import { IssueModule } from './issue/issue.module';
import { LessonModule } from './lesson/lesson.module';
import { MailModule } from './mail/mail.module';
import { NotificationModule } from './notification/notification.module';
import { QuestionModule } from './question/question.module';
import { QuizModule } from './quiz/quiz.module';
import { SessionModule } from './session/session.module';

export default [
    AccountModule,
    AuthModule,
    ChatModule,
    AssignmentModule,
    ClassModule,
    IssueModule,
    LessonModule,
    QuizModule,
    QuestionModule,
    GameModule,
    SessionModule,
    NotificationModule,
    MailModule,
];
