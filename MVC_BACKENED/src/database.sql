CREATE DATABASE IF NOT EXISTS TIMETABLE;
USE TIMETABLE;

CREATE TABLE users (
    user_id      INT PRIMARY KEY AUTO_INCREMENT,
    name         VARCHAR(100)  NOT NULL,
    email        VARCHAR(100)  UNIQUE NOT NULL,
    password     VARCHAR(255)  NOT NULL,
    role         ENUM('student', 'teacher', 'admin') NOT NULL,
    is_first_login BOOLEAN     DEFAULT TRUE,
    otp_code     VARCHAR(10)   DEFAULT NULL,
    otp_expiry   DATETIME      DEFAULT NULL,
    created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE students (
    student_id INT PRIMARY KEY,
    branch VARCHAR(50),
    semester INT,
    section VARCHAR(10),
    enrollment   VARCHAR(50)   UNIQUE,
    department   VARCHAR(100),

    FOREIGN KEY (student_id) REFERENCES users(user_id)
    ON DELETE CASCADE
);

CREATE TABLE teachers (
    teacher_id INT PRIMARY KEY,
    department VARCHAR(50),
    designation VARCHAR(50),

    FOREIGN KEY (teacher_id) REFERENCES users(user_id)
    ON DELETE CASCADE
);


CREATE TABLE admins (
    admin_id INT PRIMARY KEY,
    role_type VARCHAR(50),

    FOREIGN KEY (admin_id) REFERENCES users(user_id)
    ON DELETE CASCADE
);