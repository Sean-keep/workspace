-- Personal Workspace schema (DDL only).
-- The bootstrap admin user is created by the app at startup from
-- ADMIN_USERNAME / ADMIN_PASSWORD — this file intentionally inserts no data.
-- Keep this file in sync with backend/app/models/* and backend/alembic/versions/0001_baseline.py

CREATE DATABASE IF NOT EXISTS personal_workspace
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE personal_workspace;

-- Users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(500) NULL,
    settings JSON NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX ix_users_username (username),
    UNIQUE INDEX ix_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tasks
-- status is VARCHAR(50) on purpose: the app allows custom statuses (e.g. custom_169...)
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'todo',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    due_date DATETIME NULL,
    tags JSON NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_type VARCHAR(20) NOT NULL DEFAULT 'none',
    recurrence_days JSON NULL,
    last_completed DATETIME NULL,
    completed_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX ix_tasks_user_status (user_id, status),
    INDEX ix_tasks_user_pinned_created (user_id, is_pinned, created_at),
    INDEX ix_tasks_user_completed (user_id, completed_at),
    INDEX ix_tasks_user_due (user_id, due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notes
CREATE TABLE IF NOT EXISTS notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL DEFAULT 'Untitled',
    content TEXT NULL,
    note_type VARCHAR(20) NOT NULL DEFAULT 'note',
    checklist_items JSON NULL,
    parent_id INT NULL,
    tags JSON NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES notes(id) ON DELETE SET NULL,
    INDEX ix_notes_user_parent (user_id, parent_id),
    INDEX ix_notes_user_pinned_updated (user_id, is_pinned, updated_at),
    FULLTEXT INDEX ft_notes_title_content (title, content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Projects
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'planning',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    progress INT NOT NULL DEFAULT 0,
    deadline DATETIME NULL,
    color VARCHAR(20) NOT NULL DEFAULT '#409eff',
    tags JSON NULL,
    members INT NOT NULL DEFAULT 1,
    subtasks JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX ix_projects_user_status (user_id, status),
    INDEX ix_projects_user_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    url VARCHAR(500) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(500) NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'default',
    favicon VARCHAR(500) NULL,
    tags JSON NULL,
    visit_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX ix_bookmarks_user_category (user_id, category),
    INDEX ix_bookmarks_user_visits (user_id, visit_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Snippets
CREATE TABLE IF NOT EXISTS snippets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(500) NULL,
    language VARCHAR(50) NOT NULL DEFAULT 'plaintext',
    code TEXT NOT NULL,
    tags JSON NULL,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX ix_snippets_user_language (user_id, language),
    INDEX ix_snippets_user_updated (user_id, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Events
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    location VARCHAR(200) NULL,
    is_all_day BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_minutes INT NOT NULL DEFAULT 15,
    color VARCHAR(20) NOT NULL DEFAULT '#409EFF',
    recurrence JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX ix_events_user_start (user_id, start_time),
    INDEX ix_events_user_end (user_id, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
