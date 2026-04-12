CREATE DATABASE IF NOT EXISTS TIMETABLE;
USE TIMETABLE;


CREATE TABLE IF NOT EXISTS users (
    user_id        INT           PRIMARY KEY AUTO_INCREMENT,
    name           VARCHAR(100)  NOT NULL,
    email          VARCHAR(100)  UNIQUE NOT NULL,
    password       VARCHAR(255)  NOT NULL,
    role           ENUM('student','teacher','admin') NOT NULL,
    is_first_login BOOLEAN       DEFAULT TRUE,
    otp_code       VARCHAR(10)   DEFAULT NULL,
    otp_expiry     DATETIME      DEFAULT NULL,
    created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);
 

CREATE TABLE IF NOT EXISTS schools (
    school_id   INT          PRIMARY KEY AUTO_INCREMENT,
    school_name VARCHAR(100) NOT NULL,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);
 

CREATE TABLE IF NOT EXISTS courses (
    course_id   INT          PRIMARY KEY AUTO_INCREMENT,
    course_name VARCHAR(100) NOT NULL,
    school_id   INT,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (school_id) REFERENCES schools(school_id)
        ON DELETE SET NULL
);
 

CREATE TABLE IF NOT EXISTS branches (
    branch_id   INT         PRIMARY KEY AUTO_INCREMENT,
    branch_name VARCHAR(50) NOT NULL,
    course_id   INT,
    created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
        ON DELETE SET NULL
);
 

CREATE TABLE IF NOT EXISTS semesters (
    sem_id     INT       PRIMARY KEY AUTO_INCREMENT,
    sem_number INT       NOT NULL,
    branch_id  INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
        ON DELETE CASCADE
);
 

CREATE TABLE IF NOT EXISTS sections (
    section_id   INT         PRIMARY KEY AUTO_INCREMENT,
    section_name VARCHAR(10) NOT NULL,
    sem_id       INT,
    created_at   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sem_id) REFERENCES semesters(sem_id)
        ON DELETE CASCADE
);
 

CREATE TABLE IF NOT EXISTS teachers (
    teacher_id  INT          PRIMARY KEY,
    department  VARCHAR(100),
    designation VARCHAR(50),
    FOREIGN KEY (teacher_id) REFERENCES users(user_id)
        ON DELETE CASCADE
);
 

CREATE TABLE IF NOT EXISTS admins (
    admin_id  INT         PRIMARY KEY,
    role_type VARCHAR(50),
    FOREIGN KEY (admin_id) REFERENCES users(user_id)
        ON DELETE CASCADE
);
 

CREATE TABLE IF NOT EXISTS students (
    student_id INT          PRIMARY KEY,
    section_id INT,
    enrollment VARCHAR(50)  UNIQUE,
    department VARCHAR(100),
    FOREIGN KEY (student_id) REFERENCES users(user_id)
        ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(section_id)
        ON DELETE SET NULL
);
 

CREATE TABLE IF NOT EXISTS subjects (
    subject_id   INT         PRIMARY KEY AUTO_INCREMENT,
    subject_name VARCHAR(100) NOT NULL,
    subject_code VARCHAR(20)  UNIQUE NOT NULL,
    branch_id    INT,
    sem_id       INT,
    created_at   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
        ON DELETE SET NULL,
    FOREIGN KEY (sem_id)    REFERENCES semesters(sem_id)
        ON DELETE SET NULL
);
 

CREATE TABLE IF NOT EXISTS timetable_slots (
    slot_id     INT         PRIMARY KEY AUTO_INCREMENT,
    section_id  INT         NOT NULL,
    subject_id  INT         NOT NULL,
    teacher_id  INT         NOT NULL,
    day_of_week ENUM('Monday','Tuesday','Wednesday',
                     'Thursday','Friday','Saturday') NOT NULL,
    start_time  TIME        NOT NULL,
    end_time    TIME        NOT NULL,
    room        VARCHAR(50),
    slot_type   ENUM('lecture','lab','tutorial') DEFAULT 'lecture',
    created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES sections(section_id)
        ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)
        ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id)
        ON DELETE CASCADE
);
 
CREATE TABLE IF NOT EXISTS lecture_attendance (
    attendance_id INT         PRIMARY KEY AUTO_INCREMENT,
    slot_id       INT         NOT NULL,
    lecture_date  DATE        NOT NULL,
    status        ENUM('conducted','cancelled','delayed','teacher_absent')
                  DEFAULT 'conducted',
    reported_by   INT         DEFAULT NULL,
    remarks       VARCHAR(255) DEFAULT NULL,
    created_at    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_slot_date (slot_id, lecture_date),
    FOREIGN KEY (slot_id)     REFERENCES timetable_slots(slot_id)
        ON DELETE CASCADE,
    FOREIGN KEY (reported_by) REFERENCES users(user_id)
        ON DELETE SET NULL
);
 

CREATE TABLE IF NOT EXISTS substitutions (
    sub_id                INT  PRIMARY KEY AUTO_INCREMENT,
    slot_id               INT  NOT NULL,
    sub_date              DATE NOT NULL,
    original_teacher_id   INT  NOT NULL,
    substitute_teacher_id INT  NOT NULL,
    assigned_by           INT  NOT NULL,
    reason                VARCHAR(255) DEFAULT NULL,
    created_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (slot_id)
        REFERENCES timetable_slots(slot_id)     ON DELETE CASCADE,
    FOREIGN KEY (original_teacher_id)
        REFERENCES teachers(teacher_id)          ON DELETE CASCADE,
    FOREIGN KEY (substitute_teacher_id)
        REFERENCES teachers(teacher_id)          ON DELETE CASCADE,
    FOREIGN KEY (assigned_by)
        REFERENCES users(user_id)                ON DELETE CASCADE
);
 

CREATE TABLE IF NOT EXISTS iks_events (
    event_id    INT          PRIMARY KEY AUTO_INCREMENT,
    event_name  VARCHAR(150) NOT NULL,
    description TEXT,
    event_date  DATE         NOT NULL,
    start_time  TIME         NOT NULL,
    end_time    TIME         NOT NULL,
    venue       VARCHAR(100),
    credits     INT          DEFAULT 1,
    scope       ENUM('university','branch','section') DEFAULT 'university',
    branch_id   INT          DEFAULT NULL,
    section_id  INT          DEFAULT NULL,
    created_by  INT          NOT NULL,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id)  REFERENCES branches(branch_id)
        ON DELETE SET NULL,
    FOREIGN KEY (section_id) REFERENCES sections(section_id)
        ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id)
        ON DELETE CASCADE
);
 

CREATE TABLE IF NOT EXISTS event_attendance (
    id             INT       PRIMARY KEY AUTO_INCREMENT,
    event_id       INT       NOT NULL,
    student_id     INT       NOT NULL,
    attended_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    credits_earned INT       DEFAULT 0,
    UNIQUE KEY unique_attendance (event_id, student_id),
    FOREIGN KEY (event_id)   REFERENCES iks_events(event_id)
        ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(student_id)
        ON DELETE CASCADE
);
 

CREATE TABLE IF NOT EXISTS notifications (
    notif_id   INT          PRIMARY KEY AUTO_INCREMENT,
    user_id    INT          NOT NULL,
    type       ENUM('upcoming_lecture','substitution',
                    'event_conflict','cancellation','general') NOT NULL,
    title      VARCHAR(150) NOT NULL,
    message    TEXT,
    is_read    BOOLEAN      DEFAULT FALSE,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
);
 
CREATE TABLE IF NOT EXISTS event_conflicts (
    conflict_id   INT  PRIMARY KEY AUTO_INCREMENT,
    event_id      INT  NOT NULL,
    slot_id       INT  NOT NULL,
    conflict_date DATE NOT NULL,
    resolved      BOOLEAN   DEFAULT FALSE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_event_slot (event_id, slot_id),
    FOREIGN KEY (event_id) REFERENCES iks_events(event_id)
        ON DELETE CASCADE,
    FOREIGN KEY (slot_id)  REFERENCES timetable_slots(slot_id)
        ON DELETE CASCADE
);

USE TIMETABLE;

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    user_id      INT NOT NULL,
    endpoint     TEXT NOT NULL,
    p256dh       TEXT NOT NULL,
    auth         TEXT NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_endpoint (user_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
);

SHOW TABLES;
SELECT * FROM users;
SELECT * FROM schools;
SELECT * FROM courses;
SELECT * FROM branches;
SELECT * FROM semesters;
SELECT * FROM sections;
SELECT * FROM teachers;
SELECT * FROM admins;
SELECT * FROM students;
SELECT * FROM subjects;
SELECT * FROM timetable_slots;
SELECT * FROM lecture_attendance;
SELECT * FROM substitutions;
SELECT * FROM iks_events;
SELECT * FROM event_attendance;
SELECT * FROM notifications;
SELECT * FROM event_conflicts;




 
SELECT 'users'             AS table_name, COUNT(*) AS `rows` FROM users
UNION SELECT 'schools',       COUNT(*) FROM schools
UNION SELECT 'courses',       COUNT(*) FROM courses
UNION SELECT 'branches',      COUNT(*) FROM branches
UNION SELECT 'semesters',     COUNT(*) FROM semesters
UNION SELECT 'sections',      COUNT(*) FROM sections
UNION SELECT 'teachers',      COUNT(*) FROM teachers
UNION SELECT 'admins',        COUNT(*) FROM admins
UNION SELECT 'students',      COUNT(*) FROM students
UNION SELECT 'subjects',      COUNT(*) FROM subjects
UNION SELECT 'timetable_slots',     COUNT(*) FROM timetable_slots
UNION SELECT 'lecture_attendance',  COUNT(*) FROM lecture_attendance
UNION SELECT 'substitutions',       COUNT(*) FROM substitutions
UNION SELECT 'iks_events',          COUNT(*) FROM iks_events
UNION SELECT 'event_attendance',    COUNT(*) FROM event_attendance
UNION SELECT 'notifications',       COUNT(*) FROM notifications
UNION SELECT 'event_conflicts',     COUNT(*) FROM event_conflicts;
 
 