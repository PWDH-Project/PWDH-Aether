package model

import "time"

type Channel struct {
	ID        string    `json:"id" db:"id"`
	GuildID   string    `json:"guild_id" db:"guild_id"`
	Name      string    `json:"name" db:"name"`
	Type      string    `json:"type" db:"type"`
	Category  *string   `json:"category" db:"category"`
	Position  int       `json:"position" db:"position"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type CreateChannelRequest struct {
	Name     string  `json:"name" validate:"required,min=1,max=50"`
	Type     string  `json:"type" validate:"required,oneof=TEXT VOICE VIDEO"`
	Category *string `json:"category"`
}

type UpdateChannelRequest struct {
	Name     *string `json:"name"`
	Category *string `json:"category"`
	Position *int    `json:"position"`
}

const (
	ChannelText  = "TEXT"
	ChannelVoice = "VOICE"
	ChannelVideo = "VIDEO"
)
