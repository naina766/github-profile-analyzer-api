-- GitHub Profile Analyzer Professional Database Schema

CREATE DATABASE IF NOT EXISTS `github_analyzer`;
USE `github_analyzer`;

CREATE TABLE IF NOT EXISTS `github_profiles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `github_id` BIGINT UNIQUE NOT NULL,
    `username` VARCHAR(255) UNIQUE NOT NULL,
    `name` VARCHAR(255) DEFAULT NULL,
    `bio` TEXT DEFAULT NULL,
    `avatar_url` TEXT DEFAULT NULL,
    
    -- Basic Metrics
    `public_repos` INT DEFAULT 0,
    `followers` INT DEFAULT 0,
    `following` INT DEFAULT 0,
    
    -- Advanced Analytics Insights
    `total_stars` INT DEFAULT 0,
    `total_forks` INT DEFAULT 0,
    `top_language` VARCHAR(100) DEFAULT NULL,
    `top_repo` VARCHAR(255) DEFAULT NULL,
    
    -- Dynamically Computed Insights
    `follower_following_ratio` DECIMAL(10, 2) DEFAULT 0.00,
    `average_stars_per_repo` DECIMAL(10, 2) DEFAULT 0.00,
    `repo_activity_score` DECIMAL(10, 2) DEFAULT 0.00,
    `account_age_years` INT DEFAULT 0,
    `organizations_count` INT DEFAULT 0,
    
    -- Metadata details
    `profile_url` TEXT DEFAULT NULL,
    `account_created_at` DATETIME DEFAULT NULL,
    `analyzed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_username` (`username`),
    INDEX `idx_analyzed_at` (`analyzed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
