package model

import "time"

type UserPresence struct {
	UserID       string     `json:"user_id" db:"user_id"`
	Status       string     `json:"status" db:"status"`
	GameName     *string    `json:"game_name" db:"game_name"`
	GameStartedAt *time.Time `json:"game_started_at" db:"game_started_at"`
	CustomStatus *string    `json:"custom_status" db:"custom_status"`
	UpdatedAt    time.Time  `json:"updated_at" db:"updated_at"`
}

type UpdatePresenceRequest struct {
	Status       *string `json:"status" validate:"omitempty,oneof=ONLINE IDLE DND OFFLINE"`
	GameName     *string `json:"game_name"`
	CustomStatus *string `json:"custom_status"`
}

const (
	StatusOnline  = "ONLINE"
	StatusIdle    = "IDLE"
	StatusDND     = "DND"
	StatusOffline = "OFFLINE"
)
