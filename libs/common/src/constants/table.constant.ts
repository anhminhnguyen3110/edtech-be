export enum ETableName {
    ACCOUNT = 'account',
    QUIZ = 'quiz',
    QUESTION = 'question',
    SESSION = 'session',
    GAME = 'game',
    GAME_HISTORY = 'game_history',
    PLAYER = 'player',
    ASSIGNMENT = 'assignment',
    CLASS = 'class',
    CRITERIA = 'criteria',
    LESSON = 'lesson',
    ISSUE = 'issue',
    CRITERIA_LEVEL = 'criteria_level',
    MARKED_ASSESSMENT = 'marked_assessment',
    CRITERIA_MARK_VALUE = 'criteria_mark_value',
    CLASS_ASSIGNMENT = 'class_assignment',
    NOTIFICATION = 'notification',
    MAIL = 'mail',
    CHAT_TOPIC = 'chat_topic',
    CHAT_MESSAGE = 'chat_message',
    CHAT_FILE_KEY = 'chat_file_key',
}

export enum EQuestionType {
    MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
    MULTIPLE_OPTIONS = 'MULTIPLE_OPTIONS',
    SHORT_ANSWER = 'SHORT_ANSWER',
    TRUE_FALSE = 'TRUE_FALSE',
}

export enum EGameStatus {
    ACTIVE = 'ACTIVE',
    STARTED = 'STARTED',
    TERMINATED = 'TERMINATED',
    COMPLETED = 'COMPLETED',
}

export enum EYear {
    FOUNDATION = 'FOUNDATION',
    YEAR_1 = 'YEAR 1',
    YEAR_2 = 'YEAR 2',
    YEAR_3 = 'YEAR 3',
    YEAR_4 = 'YEAR 4',
    YEAR_5 = 'YEAR 5',
    YEAR_6 = 'YEAR 6',
    YEAR_7 = 'YEAR 7',
    YEAR_8 = 'YEAR 8',
    YEAR_9 = 'YEAR 9',
    YEAR_10 = 'YEAR 10',
    YEAR_11 = 'YEAR 11',
    YEAR_12 = 'YEAR 12',
}

export enum EChatFileType {
    PDF = 'pdf',
    DOCX = 'docx',
}

export enum ELessonFormat {
    PDF = 'pdf',
    DOC = 'doc',
    PPTX = 'pptx',
    PPSX = 'ppsx',
}

export enum EMailType {
    ACCOUNT_ACTIVATION = 'ACCOUNT_ACTIVATION',
}

export enum EMailStatus {
    PENDING = 'PENDING',
    SENT = 'SENT',
    FAILED = 'FAILED',
}
