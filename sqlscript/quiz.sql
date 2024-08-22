DROP DATABASE IF EXISTS edtech_assistant_quiz;
CREATE DATABASE IF NOT EXISTS edtech_assistant_quiz;
USE edtech_assistant_quiz;

CREATE TABLE IF NOT EXISTS quiz (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT NOT NULL,
    class_assignment_id INT NULL,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (name)
);

CREATE TABLE IF NOT EXISTS question (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_text TEXT NOT NULL,
    question_type ENUM('MULTIPLE_CHOICE', 'MULTIPLE_OPTIONS', 'SHORT_ANSWER', 'TRUE_FALSE') NOT NULL,
    choices TEXT NULL,
    correct_answers TEXT NOT NULL,
    quiz_id INT NOT NULL,
    time_limit_in_second INT NOT NULL,
    image_format VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quiz(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS game (
    id INT PRIMARY KEY AUTO_INCREMENT,
    quiz_id INT,
    game_status ENUM('ACTIVE', 'TERMINATED', 'COMPLETE') NOT NULL DEFAULT 'ACTIVE',
    game_code VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quiz(id) ON DELETE CASCADE
);

-- Create Game History table to save game id, player id, question id, player answer, and correct status
CREATE TABLE IF NOT EXISTS game_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    game_id INT,
    player_id INT,
    question_id INT,
    player_answer VARCHAR(255),
    is_correct BOOLEAN NOT NULL,
    point_awarded INT NOT NULL,
    score INT NOT NULL,
    strike_count INT NOT NULL,
    time_submitted TIMESTAMP,
    nickname VARCHAR(255),
    number_of_correct_answers INT DEFAULT 0,
    player_rank INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES game(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES question(id) ON DELETE CASCADE,
    UNIQUE (game_id, player_id, question_id),
    INDEX idx_game_player_question (game_id, player_id, question_id)
);