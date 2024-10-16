CREATE DATABASE IF NOT EXISTS mailing;

USE mailing;

-- mailing.mail_info definition

CREATE TABLE `mail_info` (
                             `mail_username` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'G메일 username',
                             `mail_password` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'G메일 password',
                             `index_cn` int NOT NULL DEFAULT '0',
                             PRIMARY KEY (`index_cn`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;