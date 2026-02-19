package model

import "errors"

var (
	ErrNotFound           = errors.New("not found")
	ErrUserNotFound       = errors.New("user not found")
	ErrEmailTaken         = errors.New("email already in use")
	ErrUsernameTaken      = errors.New("username already in use")
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrGuildNotFound      = errors.New("guild not found")
	ErrChannelNotFound    = errors.New("channel not found")
	ErrMessageNotFound    = errors.New("message not found")
	ErrNotAuthorized      = errors.New("not authorized")
	ErrNotMember          = errors.New("not a member of this guild")
	ErrAlreadyMember      = errors.New("already a member")
	ErrInvalidInvite      = errors.New("invalid or expired invite")
	ErrConversationNotFound = errors.New("conversation not found")
)
