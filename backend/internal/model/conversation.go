package model

import "time"

type Conversation struct {
	ID        string    `json:"id" db:"id"`
	IsGroup   bool      `json:"is_group" db:"is_group"`
	Name      *string   `json:"name" db:"name"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type ConversationResponse struct {
	ID        string         `json:"id"`
	IsGroup   bool           `json:"is_group"`
	Name      *string        `json:"name"`
	Members   []UserResponse `json:"members"`
	CreatedAt time.Time      `json:"created_at"`
}

type DirectMessage struct {
	ID             string     `json:"id" db:"id"`
	ConversationID string     `json:"conversation_id" db:"conversation_id"`
	UserID         string     `json:"user_id" db:"user_id"`
	Content        string     `json:"content" db:"content"`
	AttachmentURL  *string    `json:"attachment_url" db:"attachment_url"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
}

type DMResponse struct {
	ID            string       `json:"id"`
	ConversationID string     `json:"conversation_id"`
	Content       string       `json:"content"`
	AttachmentURL *string      `json:"attachment_url"`
	User          UserResponse `json:"user"`
	CreatedAt     time.Time    `json:"created_at"`
}

type CreateConversationRequest struct {
	UserIDs []string `json:"user_ids" validate:"required,min=1"`
	Name    *string  `json:"name"`
}

type CreateDMRequest struct {
	Content       string  `json:"content" validate:"required,max=4000"`
	AttachmentURL *string `json:"attachment_url"`
}
