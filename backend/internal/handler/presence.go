package handler

import (
	"time"

	"pwdh-aether/internal/model"
	"pwdh-aether/internal/repository"

	"github.com/gofiber/fiber/v2"
)

type PresenceHandler struct {
	presence *repository.PresenceRepository
}

func NewPresenceHandler(presence *repository.PresenceRepository) *PresenceHandler {
	return &PresenceHandler{presence: presence}
}

func (h *PresenceHandler) Update(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	var req model.UpdatePresenceRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request"})
	}

	existing, _ := h.presence.GetByUserID(userID)
	p := &model.UserPresence{
		UserID:       userID,
		Status:       existing.Status,
		GameName:     existing.GameName,
		GameStartedAt: existing.GameStartedAt,
		CustomStatus: existing.CustomStatus,
	}

	if req.Status != nil {
		p.Status = *req.Status
	}
	if req.GameName != nil {
		p.GameName = req.GameName
		if *req.GameName != "" {
			now := time.Now()
			p.GameStartedAt = &now
		} else {
			p.GameStartedAt = nil
		}
	}
	if req.CustomStatus != nil {
		p.CustomStatus = req.CustomStatus
	}

	if err := h.presence.Upsert(p); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "update failed"})
	}
	return c.JSON(p)
}

func (h *PresenceHandler) Get(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	p, err := h.presence.GetByUserID(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "fetch failed"})
	}
	return c.JSON(p)
}

func (h *PresenceHandler) GetByGuild(c *fiber.Ctx) error {
	guildID := c.Params("id")
	presences, err := h.presence.GetByGuildID(guildID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "fetch failed"})
	}
	if presences == nil {
		presences = []model.UserPresence{}
	}
	return c.JSON(presences)
}
