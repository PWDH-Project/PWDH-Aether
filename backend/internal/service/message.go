package service

import (
	"time"

	"pwdh-aether/internal/model"
	"pwdh-aether/internal/repository"
	"pwdh-aether/internal/ws"

	"github.com/google/uuid"
)

type MessageService struct {
	messages *repository.MessageRepository
	users    *repository.UserRepository
	guilds   *repository.GuildRepository
	channels *repository.ChannelRepository
	hub      *ws.Hub
}

func NewMessageService(
	messages *repository.MessageRepository,
	users *repository.UserRepository,
	guilds *repository.GuildRepository,
	channels *repository.ChannelRepository,
	hub *ws.Hub,
) *MessageService {
	return &MessageService{
		messages: messages,
		users:    users,
		guilds:   guilds,
		channels: channels,
		hub:      hub,
	}
}

func (s *MessageService) Create(userID, channelID string, req model.CreateMessageRequest) (*model.MessageResponse, error) {
	ch, err := s.channels.GetByID(channelID)
	if err != nil {
		return nil, err
	}
	if member, _ := s.guilds.IsMember(ch.GuildID, userID); !member {
		return nil, model.ErrNotMember
	}

	msg := &model.Message{
		ID:            uuid.New().String(),
		ChannelID:     channelID,
		UserID:        userID,
		Content:       req.Content,
		AttachmentURL: req.AttachmentURL,
	}
	if err := s.messages.Create(msg); err != nil {
		return nil, err
	}

	user, _ := s.users.GetByID(userID)
	resp := &model.MessageResponse{
		ID:            msg.ID,
		ChannelID:     channelID,
		Content:       msg.Content,
		AttachmentURL: msg.AttachmentURL,
		CreatedAt:     time.Now(),
		User:          user.ToResponse(),
		Reactions:     []model.Reaction{},
	}

	s.hub.BroadcastToRoom(channelID, ws.Event{
		Type:   ws.EventMessageCreate,
		Data:   resp,
		RoomID: channelID,
	})

	return resp, nil
}

func (s *MessageService) GetByChannelID(userID, channelID string, before *time.Time, limit int) ([]model.MessageResponse, error) {
	ch, err := s.channels.GetByID(channelID)
	if err != nil {
		return nil, err
	}
	if member, _ := s.guilds.IsMember(ch.GuildID, userID); !member {
		return nil, model.ErrNotMember
	}
	if limit <= 0 || limit > 50 {
		limit = 50
	}
	return s.messages.GetByChannelID(channelID, before, limit)
}

func (s *MessageService) Update(userID, messageID, content string) (*model.MessageResponse, error) {
	msg, err := s.messages.GetByID(messageID)
	if err != nil {
		return nil, err
	}
	if msg.UserID != userID {
		return nil, model.ErrNotAuthorized
	}
	if err := s.messages.Update(messageID, content); err != nil {
		return nil, err
	}

	user, _ := s.users.GetByID(userID)
	now := time.Now()
	resp := &model.MessageResponse{
		ID:            msg.ID,
		ChannelID:     msg.ChannelID,
		Content:       content,
		AttachmentURL: msg.AttachmentURL,
		CreatedAt:     msg.CreatedAt,
		UpdatedAt:     &now,
		User:          user.ToResponse(),
		Reactions:     []model.Reaction{},
	}

	s.hub.BroadcastToRoom(msg.ChannelID, ws.Event{
		Type:   ws.EventMessageUpdate,
		Data:   resp,
		RoomID: msg.ChannelID,
	})

	return resp, nil
}

func (s *MessageService) Delete(userID, messageID string) error {
	msg, err := s.messages.GetByID(messageID)
	if err != nil {
		return err
	}
	if msg.UserID != userID {
		ch, err := s.channels.GetByID(msg.ChannelID)
		if err != nil {
			return err
		}
		member, err := s.guilds.GetMember(ch.GuildID, userID)
		if err != nil {
			return model.ErrNotAuthorized
		}
		if member.Role != model.RoleOwner && member.Role != model.RoleAdmin && member.Role != model.RoleModerator {
			return model.ErrNotAuthorized
		}
	}
	if err := s.messages.Delete(messageID); err != nil {
		return err
	}

	s.hub.BroadcastToRoom(msg.ChannelID, ws.Event{
		Type:   ws.EventMessageDelete,
		Data:   map[string]string{"id": messageID, "channel_id": msg.ChannelID},
		RoomID: msg.ChannelID,
	})
	return nil
}

func (s *MessageService) AddReaction(userID, messageID, emoji string) error {
	_, err := s.messages.GetByID(messageID)
	if err != nil {
		return err
	}
	return s.messages.AddReaction(messageID, userID, emoji)
}

func (s *MessageService) RemoveReaction(userID, messageID, emoji string) error {
	return s.messages.RemoveReaction(messageID, userID, emoji)
}
