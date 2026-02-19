package model

import "time"

type Guild struct {
	ID         string    `json:"id" db:"id"`
	Name       string    `json:"name" db:"name"`
	IconURL    *string   `json:"icon_url" db:"icon_url"`
	OwnerID    string    `json:"owner_id" db:"owner_id"`
	InviteCode string    `json:"invite_code" db:"invite_code"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

type Member struct {
	UserID   string    `json:"user_id" db:"user_id"`
	GuildID  string    `json:"guild_id" db:"guild_id"`
	Role     string    `json:"role" db:"role"`
	JoinedAt time.Time `json:"joined_at" db:"joined_at"`
}

type MemberResponse struct {
	User     UserResponse `json:"user"`
	Role     string       `json:"role"`
	JoinedAt time.Time    `json:"joined_at"`
	Status   string       `json:"status"`
}

type Invite struct {
	Code      string     `json:"code" db:"code"`
	GuildID   string     `json:"guild_id" db:"guild_id"`
	CreatorID string     `json:"creator_id" db:"creator_id"`
	MaxUses   *int       `json:"max_uses" db:"max_uses"`
	Uses      int        `json:"uses" db:"uses"`
	ExpiresAt *time.Time `json:"expires_at" db:"expires_at"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
}

type CreateGuildRequest struct {
	Name string `json:"name" validate:"required,min=1,max=100"`
}

type UpdateGuildRequest struct {
	Name    *string `json:"name"`
	IconURL *string `json:"icon_url"`
}

type JoinGuildRequest struct {
	InviteCode string `json:"invite_code" validate:"required"`
}

type UpdateMemberRoleRequest struct {
	UserID string `json:"user_id" validate:"required"`
	Role   string `json:"role" validate:"required,oneof=ADMIN MODERATOR MEMBER"`
}

const (
	RoleOwner     = "OWNER"
	RoleAdmin     = "ADMIN"
	RoleModerator = "MODERATOR"
	RoleMember    = "MEMBER"
)
