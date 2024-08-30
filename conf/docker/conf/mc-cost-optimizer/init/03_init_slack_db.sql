CREATE DATABASE IF NOT EXISTS slack_test;

USE slack_test;

-- slack_test.slack_token definition

CREATE TABLE `slack_token` (
                               `id` int NOT NULL AUTO_INCREMENT,
                               `userId` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
                               `OAuthToken` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
                               `channelId` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL,
                               PRIMARY KEY (`id`),
                               UNIQUE KEY `userId` (`userId`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
