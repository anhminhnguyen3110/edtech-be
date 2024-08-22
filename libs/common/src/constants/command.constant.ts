export enum ECommandAssignment {
    FIND_ALL_ASSIGNMENTS = 'assignment-find-all',
    FIND_ONE_ASSIGNMENT = 'assignment',
}

export enum ECommandIssue {
    FIND_ALL_ISSUES = 'issue-find-all',
    FIND_ONE_ISSUE = 'issue',
    CREATE_ISSUE = 'issue-create',
    UPDATE_ISSUE = 'issue-update',
    REMOVE_ISSUE = 'issue-remove',
    EXTRACT_ISSUES = 'issue-extract',
    SAVE_EXTRACTED_ISSUES = 'issue-save-extracted',
}

export enum ECommandLesson {
    FIND_ALL_LESSONS = 'lesson-find-all',
    DOWNLOAD_LESSON = 'lesson-download',
    REMOVE_LESSON = 'lesson-remove',
    UPDATE_LESSON = 'lesson-update',
    GENERATE_LESSON = 'lesson-generate',
    SAVE_GENERATE_LESSON = 'lesson-save-generate',
}

export enum ECommandClass {
    FIND_ALL_CLASSES = 'class-find-all',
    FIND_ONE_CLASS = 'class',
}
export enum ECommandTest {
    TEST = 'test',
}

export enum ECommandQuiz {
    CREATE_QUIZ = 'quiz-create',
    FIND_ALL_QUIZZES = 'quiz-find-all',
    FIND_ONE_QUIZ = 'quiz-find-one',
    UPDATE_QUIZ = 'quiz-update',
    REMOVE_QUIZ = 'quiz-remove',
    GENERATE_QUIZ = 'quiz-generate',
    SAVE_GENERATE_QUIZ = 'quiz-save-generate',
}

export enum ECommandQuestion {
    CREATE_QUESTION = 'question-create',
    FIND_ALL_QUESTIONS = 'question-find-all',
    FIND_ONE_QUESTION = 'question-find-one',
    UPDATE_QUESTION = 'question-update',
    REMOVE_QUESTION = 'question-remove',
}

export enum ECommandGame {
    CREATE_GAME = 'game-create',
    UPDATE_GAME = 'game-update',
    GET_GAME_DETAIL = 'game-get-detail',
    GET_GAMES = 'game-get-games',
}

export enum ECommandGameHistory {
    SAVE_GAME_HISTORY = 'game-history-save',
}

export enum ECommandNotification {
    CREATE_NOTIFICATION = 'notification-create',
    FIND_ALL_NOTIFICATIONS = 'notification-find-all',
    FIND_ONE_NOTIFICATION = 'notification-find-one',
    UPDATE_NOTIFICATION = 'notification-update',
    REMOVE_NOTIFICATION = 'notification-remove',
}

export enum ECommandMail {
    UPDATE_MAIL = 'mail-update',
}

export enum ECommandChat {
    CREATE_CHAT_MESSAGE = 'chat-create-message',
    GET_CHAT_TOPIC = 'chat-get-topic',
    GET_CHAT_MESSAGES = 'chat-get-messages',
    DELETE_CHAT_TOPIC = 'chat-delete-topic',
    UPDATE_CHAT_TOPIC = 'chat-update-topic',
    GET_VECTOR_DB = 'chat-get-vector-db',
}
