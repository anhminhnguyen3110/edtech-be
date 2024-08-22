-- Drop database if it exists
DROP DATABASE IF EXISTS edtech_assistant_assignment;
CREATE DATABASE edtech_assistant_assignment;
USE edtech_assistant_assignment;

-- Drop and create class table
DROP TABLE IF EXISTS class;
CREATE TABLE class (
    id INT PRIMARY KEY AUTO_INCREMENT,
    year ENUM('FOUNDATION','YEAR 1','YEAR 2','YEAR 3','YEAR 4','YEAR 5','YEAR 6','YEAR 7','YEAR 8','YEAR 9','YEAR 10','YEAR 11','YEAR 12') NOT NULL,
    name VARCHAR(255),
    subject VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Drop and create assignment table
DROP TABLE IF EXISTS assignment;
CREATE TABLE assignment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    year ENUM('FOUNDATION','YEAR 1','YEAR 2','YEAR 3','YEAR 4','YEAR 5','YEAR 6','YEAR 7','YEAR 8','YEAR 9','YEAR 10','YEAR 11','YEAR 12') NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Drop and create class_assignment table
DROP TABLE IF EXISTS class_assignment;
CREATE TABLE class_assignment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_id INT,
    assignment_id INT,
    UNIQUE (class_id, assignment_id),
    FOREIGN KEY (class_id) REFERENCES class(id) ON DELETE CASCADE,
    FOREIGN KEY (assignment_id) REFERENCES assignment(id) ON DELETE CASCADE,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Drop and create marked_assessment table
DROP TABLE IF EXISTS marked_assessment;
CREATE TABLE marked_assessment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    assessment_id INT,
    student_name VARCHAR(255),
    feedback TEXT,
    extracted_text TEXT,
    class_id INT,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assessment_id) REFERENCES assignment(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES class(id) ON DELETE CASCADE
);

-- Drop and create criteria table
DROP TABLE IF EXISTS criteria;
CREATE TABLE criteria (
    id INT PRIMARY KEY AUTO_INCREMENT,
    assignment_id INT,
    description TEXT,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES assignment(id) ON DELETE CASCADE
);

-- Drop and create criteria_level table
DROP TABLE IF EXISTS criteria_level;
CREATE TABLE criteria_level (
    id INT PRIMARY KEY AUTO_INCREMENT,
    criteria_id INT,
    name VARCHAR(100),
    score TINYINT,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (criteria_id) REFERENCES criteria(id) ON DELETE CASCADE
);

-- Drop and create criteria_mark_value table
DROP TABLE IF EXISTS criteria_mark_value;
CREATE TABLE criteria_mark_value (
    id INT PRIMARY KEY AUTO_INCREMENT,
    marked_assessment_id INT,
    criteria_level_id INT,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (marked_assessment_id) REFERENCES marked_assessment(id) ON DELETE CASCADE,
    FOREIGN KEY (criteria_level_id) REFERENCES criteria_level(id) ON DELETE CASCADE
);

CREATE TABLE lesson (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_assignment_id INT,
    name VARCHAR(255),
    file_format ENUM('pdf', 'docx', 'pptx', 'ppsx'),
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_assignment_id) REFERENCES class_assignment(id) ON DELETE CASCADE
);

CREATE TABLE issue (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_assignment_id INT,
    name VARCHAR(255),
    student_count INT,
    student_rate VARCHAR(10),
    description TEXT,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE (name, class_assignment_id),
    INDEX (class_assignment_id),
    FOREIGN KEY (class_assignment_id) REFERENCES class_assignment(id) ON DELETE CASCADE
);
