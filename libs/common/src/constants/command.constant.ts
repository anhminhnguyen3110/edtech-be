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
    GET_GAME_DETAIL = 'game-get-detail',
    GET_GAMES = 'game-get-games',
    UPDATE_GAME_STATUS = 'game-update-status',
}

export enum ECommandGameHistory {
    SAVE_GAME_HISTORY = 'game-history-save',
    GET_GAME_HISTORY_DETAIL = 'game-history-get-detail',
    GET_PLAYERS_BY_ACCOUNT_ID = 'game-get-players-by-account-id',
    GET_PLAYERS_PERFORMANCE_PLAYER_SEARCH = 'game-get-players-performance',
    GET_QUESTIONS_BY_GAME_ID = 'game-get-question-by-game-history-id',
    GET_PLAYERS_BY_GAME_ID = 'game-get-players-by-history-id',
    GET_PLAYER_DETAIL_BY_GAME_ID = 'game-get-players-detail-by-history-id',
    GET_PLAYERS_PERFORMANCE_GAME_SEARCH = 'game-get-players-performance-game-search',
    GET_QUESTION_DETAIL_BY_GAME_ID = 'game-get-question-detail-by-game-history-id',
    GET_GAME_HISTORY_PERFORMANCE_BY_NICKNAME = 'game-get-game-history-performance-by-nickname',
    GET_PERFORMANCE_DETAIL = 'game-get-performance-detail',
    GET_PERFORMANCE_INSIGHT = 'game-get-performance-insight',
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
