package model

import "time"

type LFGPost struct {
	ID          string    `json:"id" db:"id"`
	GuildID     string    `json:"guild_id" db:"guild_id"`
	UserID      string    `json:"user_id" db:"user_id"`
	GameName    string    `json:"game_name" db:"game_name"`
	Description *string   `json:"description" db:"description"`
	SlotsTotal  int       `json:"slots_total" db:"slots_total"`
	SlotsFilled int       `json:"slots_filled" db:"slots_filled"`
	ExpiresAt   time.Time `json:"expires_at" db:"expires_at"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

type LFGPostResponse struct {
	LFGPost
	Creator      UserResponse   `json:"creator"`
	Participants []UserResponse `json:"participants"`
}

type CreateLFGRequest struct {
	GameName    string  `json:"game_name" validate:"required,max=100"`
	Description *string `json:"description"`
	SlotsTotal  int     `json:"slots_total" validate:"required,min=2,max=100"`
	ExpiresIn   int     `json:"expires_in_minutes" validate:"required,min=5,max=1440"`
}

type SoundboardClip struct {
	ID         string    `json:"id" db:"id"`
	GuildID    string    `json:"guild_id" db:"guild_id"`
	Name       string    `json:"name" db:"name"`
	FileURL    string    `json:"file_url" db:"file_url"`
	UploadedBy string    `json:"uploaded_by" db:"uploaded_by"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

type CreateSoundboardClipRequest struct {
	Name string `json:"name" validate:"required,min=1,max=50"`
}
