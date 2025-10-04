create database Social_media_db;
use  social_media_db;
CREATE TABLE USER (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    follower_count INT DEFAULT 0,
    profile_pic_url VARCHAR(255),
    is_private BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at DATETIME
);

CREATE TABLE POST (
    post_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    caption TEXT, -- Added caption field
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE CASCADE
);

-- Creating the POST_LIKE table
CREATE TABLE POST_LIKE (
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    PRIMARY KEY (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES POST(post_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE CASCADE
);

CREATE TABLE Saved_posts(
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    PRIMARY KEY (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES POST(post_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE CASCADE
);

CREATE TABLE MEDIA (
    media_id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    media_url VARCHAR(255) NOT NULL,
    media_type VARCHAR(50), 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES POST(post_id) ON DELETE CASCADE
);


CREATE TABLE HASHTAG (
    hashtag_id INT PRIMARY KEY AUTO_INCREMENT,
    hashtag_text VARCHAR(255) NOT NULL UNIQUE
);


CREATE TABLE POST_HASHTAG (
    post_id INT NOT NULL,
    hashtag_id INT NOT NULL,
    PRIMARY KEY (post_id, hashtag_id),
    FOREIGN KEY (post_id) REFERENCES POST(post_id) ON DELETE CASCADE,
    FOREIGN KEY (hashtag_id) REFERENCES HASHTAG(hashtag_id) ON DELETE CASCADE
);

CREATE TABLE COMMENT (
    comment_id INT PRIMARY KEY AUTO_INCREMENT,
    comment_text VARCHAR(1000) NOT NULL,
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES POST(post_id) ON DELETE CASCADE
);


CREATE TABLE FOLLOW (
    follower_id INT NOT NULL,
    following_id INT NOT NULL,
    PRIMARY KEY (follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES USER(user_id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES USER(user_id) ON DELETE CASCADE
);


CREATE TABLE STORY (
    story_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    media_url VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE CASCADE
);


CREATE TABLE STORY_LIKE (
    story_id INT NOT NULL,
    user_id INT NOT NULL,
    PRIMARY KEY (story_id, user_id),
    FOREIGN KEY (story_id) REFERENCES STORY(story_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE CASCADE
);

CREATE TABLE STORY_VIEWS (
    story_id INT NOT NULL,
    user_id INT NOT NULL,
    PRIMARY KEY (story_id, user_id),
    FOREIGN KEY (story_id) REFERENCES STORY(story_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE CASCADE
);


CREATE TABLE CHAT (
    chat_id INT PRIMARY KEY AUTO_INCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE USER_CHAT (
    user_id INT NOT NULL,
    chat_id INT NOT NULL,
    PRIMARY KEY (user_id, chat_id),
    FOREIGN KEY (user_id) REFERENCES USER(user_id) ON DELETE CASCADE,
    FOREIGN KEY (chat_id) REFERENCES CHAT(chat_id) ON DELETE CASCADE
);


CREATE TABLE DIRECT_MESSAGE (
    message_id INT PRIMARY KEY AUTO_INCREMENT,
    chat_id INT NOT NULL,
    sender_id INT NOT NULL,
    message_text TEXT,
    media_url VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES CHAT(chat_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES USER(user_id) ON DELETE CASCADE
);
