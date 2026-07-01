CREATE TABLE admin_tb (
    id         SERIAL PRIMARY KEY,
    username   VARCHAR(50)  NOT NULL UNIQUE,
    nickname   VARCHAR(100) NOT NULL,
    password   VARCHAR(255) NOT NULL
);

INSERT INTO admin_tb (username, nickname, password)
VALUES ('admin', '物业管理员01', '123456')
ON CONFLICT (username) DO NOTHING;