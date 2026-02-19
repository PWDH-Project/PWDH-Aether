package service

import (
	"pwdh-aether/internal/model"
	"pwdh-aether/internal/repository"

	"github.com/google/uuid"
)

type ChannelService struct {
	channels *repository.ChannelRepository
	guilds   *repository.GuildRepository
}

func NewChannelService(channels *repository.ChannelRepository, guilds *repository.GuildRepository) *ChannelService {
	return &ChannelService{channels: channels, guilds: guilds}
}

func (s *ChannelService) Create(userID, guildID string, req model.CreateChannelRequest) (*model.Channel, error) {
	if err := s.requireMember(guildID, userID, model.RoleOwner, model.RoleAdmin); err != nil {
		return nil, err
	}

	pos, _ := s.channels.GetNextPosition(guildID)

	ch := &model.Channel{
		ID:       uuid.New().String(),
		GuildID:  guildID,
		Name:     req.Name,
		Type:     req.Type,
		Category: req.Category,
		Position: pos,
	}
	if err := s.channels.Create(ch); err != nil {
		return nil, err
	}
	return ch, nil
}

func (s *ChannelService) GetByGuildID(userID, guildID string) ([]model.Channel, error) {
	if member, _ := s.guilds.IsMember(guildID, userID); !member {
		return nil, model.ErrNotMember
	}
	return s.channels.GetByGuildID(guildID)
}

func (s *ChannelService) Update(userID, channelID string, req model.UpdateChannelRequest) (*model.Channel, error) {
	ch, err := s.channels.GetByID(channelID)
	if err != nil {
		return nil, err
	}
	if err := s.requireMember(ch.GuildID, userID, model.RoleOwner, model.RoleAdmin); err != nil {
		return nil, err
	}
	if req.Name != nil {
		ch.Name = *req.Name
	}
	if req.Category != nil {
		ch.Category = req.Category
	}
	if req.Position != nil {
		ch.Position = *req.Position
	}
	if err := s.channels.Update(ch); err != nil {
		return nil, err
	}
	return ch, nil
}

func (s *ChannelService) Delete(userID, channelID string) error {
	ch, err := s.channels.GetByID(channelID)
	if err != nil {
		return err
	}
	if err := s.requireMember(ch.GuildID, userID, model.RoleOwner, model.RoleAdmin); err != nil {
		return err
	}
	return s.channels.Delete(channelID)
}

func (s *ChannelService) GetByID(id string) (*model.Channel, error) {
	return s.channels.GetByID(id)
}

func (s *ChannelService) requireMember(guildID, userID string, roles ...string) error {
	member, err := s.guilds.GetMember(guildID, userID)
	if err != nil {
		return model.ErrNotMember
	}
	for _, r := range roles {
		if member.Role == r {
			return nil
		}
	}
	return model.ErrNotAuthorized
}
