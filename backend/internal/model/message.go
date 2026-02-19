package model

import "time"

type Message struct {
	ID            string     `json:"id" db:"id"`
	ChannelID     string     `json:"channel_id" db:"channel_id"`
	UserID        string     `json:"user_id" db:"user_id"`
	Content       string     `json:"content" db:"content"`
	AttachmentURL *string    `json:"attachment_url" db:"attachment_url"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt     *time.Time `json:"updated_at" db:"updated_at"`
}

type MessageResponse struct {
	ID            string     `json:"id"`
	ChannelID     string     `json:"channel_id"`
	Content       string     `json:"content"`
	AttachmentURL *string    `json:"attachment_url"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     *time.Time `json:"updated_at"`
	User          UserResponse `json:"user"`
	Reactions     []Reaction `json:"reactions"`
}

type CreateMessageRequest struct {
	Content       string  `json:"content" validate:"required,max=4000"`
	AttachmentURL *string `json:"attachment_url"`
}

type UpdateMessageRequest struct {
	Content string `json:"content" validate:"required,max=4000"`
}

type Reaction struct {
	Emoji string `json:"emoji"`
	Count int    `json:"count"`
	Me    bool   `json:"me"`
}

type ReactionRecord struct {
	ID        string    `json:"id" db:"id"`
	MessageID string    `json:"message_id" db:"message_id"`
	UserID    string    `json:"user_id" db:"user_id"`
	Emoji     string    `json:"emoji" db:"emoji"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}
