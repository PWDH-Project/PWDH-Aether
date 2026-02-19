package service

import (
	"pwdh-aether/internal/model"
	"pwdh-aether/internal/repository"

	"github.com/google/uuid"
)

type GuildService struct {
	guilds   *repository.GuildRepository
	channels *repository.ChannelRepository
}

func NewGuildService(guilds *repository.GuildRepository, channels *repository.ChannelRepository) *GuildService {
	return &GuildService{guilds: guilds, channels: channels}
}

func (s *GuildService) Create(userID string, req model.CreateGuildRequest) (*model.Guild, error) {
	guild := &model.Guild{
		ID:      uuid.New().String(),
		Name:    req.Name,
		OwnerID: userID,
	}
	if err := s.guilds.Create(guild); err != nil {
		return nil, err
	}
	if err := s.guilds.AddMember(guild.ID, userID, model.RoleOwner); err != nil {
		return nil, err
	}

	defaultChannel := &model.Channel{
		ID:      uuid.New().String(),
		GuildID: guild.ID,
		Name:    "allgemein",
		Type:    model.ChannelText,
	}
	_ = s.channels.Create(defaultChannel)

	return guild, nil
}

func (s *GuildService) GetByID(id string) (*model.Guild, error) {
	return s.guilds.GetByID(id)
}

func (s *GuildService) GetByUserID(userID string) ([]model.Guild, error) {
	return s.guilds.GetByUserID(userID)
}

func (s *GuildService) Update(userID, guildID string, req model.UpdateGuildRequest) (*model.Guild, error) {
	if err := s.requireRole(guildID, userID, model.RoleOwner, model.RoleAdmin); err != nil {
		return nil, err
	}
	guild, err := s.guilds.GetByID(guildID)
	if err != nil {
		return nil, err
	}
	if req.Name != nil {
		guild.Name = *req.Name
	}
	if req.IconURL != nil {
		guild.IconURL = req.IconURL
	}
	if err := s.guilds.Update(guild); err != nil {
		return nil, err
	}
	return guild, nil
}

func (s *GuildService) Delete(userID, guildID string) error {
	guild, err := s.guilds.GetByID(guildID)
	if err != nil {
		return err
	}
	if guild.OwnerID != userID {
		return model.ErrNotAuthorized
	}
	return s.guilds.Delete(guildID)
}

func (s *GuildService) Join(userID, inviteCode string) (*model.Guild, error) {
	guild, err := s.guilds.GetByInviteCode(inviteCode)
	if err != nil {
		return nil, err
	}
	if member, _ := s.guilds.IsMember(guild.ID, userID); member {
		return nil, model.ErrAlreadyMember
	}
	if err := s.guilds.AddMember(guild.ID, userID, model.RoleMember); err != nil {
		return nil, err
	}
	return guild, nil
}

func (s *GuildService) Leave(userID, guildID string) error {
	guild, err := s.guilds.GetByID(guildID)
	if err != nil {
		return err
	}
	if guild.OwnerID == userID {
		return model.ErrNotAuthorized
	}
	return s.guilds.RemoveMember(guildID, userID)
}

func (s *GuildService) GetMembers(guildID string) ([]model.MemberResponse, error) {
	return s.guilds.GetMembers(guildID)
}

func (s *GuildService) KickMember(actorID, guildID, targetID string) error {
	if err := s.requireRole(guildID, actorID, model.RoleOwner, model.RoleAdmin, model.RoleModerator); err != nil {
		return err
	}
	target, err := s.guilds.GetMember(guildID, targetID)
	if err != nil {
		return err
	}
	if target.Role == model.RoleOwner {
		return model.ErrNotAuthorized
	}
	return s.guilds.RemoveMember(guildID, targetID)
}

func (s *GuildService) UpdateMemberRole(actorID, guildID, targetID, role string) error {
	if err := s.requireRole(guildID, actorID, model.RoleOwner, model.RoleAdmin); err != nil {
		return err
	}
	return s.guilds.UpdateMemberRole(guildID, targetID, role)
}

func (s *GuildService) requireRole(guildID, userID string, roles ...string) error {
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
