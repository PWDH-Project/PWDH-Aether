package handler

import (
	"errors"

	"pwdh-aether/internal/model"
	"pwdh-aether/internal/service"

	"github.com/gofiber/fiber/v2"
)

type GuildHandler struct {
	guilds *service.GuildService
}

func NewGuildHandler(guilds *service.GuildService) *GuildHandler {
	return &GuildHandler{guilds: guilds}
}

func (h *GuildHandler) Create(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	var req model.CreateGuildRequest
	if err := c.BodyParser(&req); err != nil || req.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "name is required"})
	}

	guild, err := h.guilds.Create(userID, req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create server"})
	}
	return c.Status(fiber.StatusCreated).JSON(guild)
}

func (h *GuildHandler) GetByID(c *fiber.Ctx) error {
	guild, err := h.guilds.GetByID(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "server not found"})
	}
	return c.JSON(guild)
}

func (h *GuildHandler) GetMyGuilds(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	guilds, err := h.guilds.GetByUserID(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch servers"})
	}
	if guilds == nil {
		guilds = []model.Guild{}
	}
	return c.JSON(guilds)
}

func (h *GuildHandler) Update(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	var req model.UpdateGuildRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	guild, err := h.guilds.Update(userID, c.Params("id"), req)
	if err != nil {
		if errors.Is(err, model.ErrNotAuthorized) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "update failed"})
	}
	return c.JSON(guild)
}

func (h *GuildHandler) Delete(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	err := h.guilds.Delete(userID, c.Params("id"))
	if err != nil {
		if errors.Is(err, model.ErrNotAuthorized) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "delete failed"})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *GuildHandler) Join(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	var req model.JoinGuildRequest
	if err := c.BodyParser(&req); err != nil || req.InviteCode == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invite_code is required"})
	}

	guild, err := h.guilds.Join(userID, req.InviteCode)
	if err != nil {
		if errors.Is(err, model.ErrInvalidInvite) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "invalid invite code"})
		}
		if errors.Is(err, model.ErrAlreadyMember) {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "already a member"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "join failed"})
	}
	return c.JSON(guild)
}

func (h *GuildHandler) Leave(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	err := h.guilds.Leave(userID, c.Params("id"))
	if err != nil {
		if errors.Is(err, model.ErrNotAuthorized) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "owner cannot leave"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "leave failed"})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *GuildHandler) GetMembers(c *fiber.Ctx) error {
	members, err := h.guilds.GetMembers(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch members"})
	}
	if members == nil {
		members = []model.MemberResponse{}
	}
	return c.JSON(members)
}

func (h *GuildHandler) KickMember(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	targetID := c.Params("userId")
	err := h.guilds.KickMember(userID, c.Params("id"), targetID)
	if err != nil {
		if errors.Is(err, model.ErrNotAuthorized) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "kick failed"})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *GuildHandler) UpdateMemberRole(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	var req model.UpdateMemberRoleRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request"})
	}
	err := h.guilds.UpdateMemberRole(userID, c.Params("id"), req.UserID, req.Role)
	if err != nil {
		if errors.Is(err, model.ErrNotAuthorized) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "role update failed"})
	}
	return c.SendStatus(fiber.StatusNoContent)
}
