package handler

import (
	"errors"

	"pwdh-aether/internal/model"
	"pwdh-aether/internal/service"

	"github.com/gofiber/fiber/v2"
)

type ChannelHandler struct {
	channels *service.ChannelService
}

func NewChannelHandler(channels *service.ChannelService) *ChannelHandler {
	return &ChannelHandler{channels: channels}
}

func (h *ChannelHandler) Create(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	var req model.CreateChannelRequest
	if err := c.BodyParser(&req); err != nil || req.Name == "" || req.Type == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "name and type are required"})
	}

	ch, err := h.channels.Create(userID, c.Params("id"), req)
	if err != nil {
		if errors.Is(err, model.ErrNotAuthorized) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to create channel"})
	}
	return c.Status(fiber.StatusCreated).JSON(ch)
}

func (h *ChannelHandler) GetByGuild(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	channels, err := h.channels.GetByGuildID(userID, c.Params("id"))
	if err != nil {
		if errors.Is(err, model.ErrNotMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch channels"})
	}
	if channels == nil {
		channels = []model.Channel{}
	}
	return c.JSON(channels)
}

func (h *ChannelHandler) Update(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	var req model.UpdateChannelRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request body"})
	}

	ch, err := h.channels.Update(userID, c.Params("id"), req)
	if err != nil {
		if errors.Is(err, model.ErrNotAuthorized) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "update failed"})
	}
	return c.JSON(ch)
}

func (h *ChannelHandler) Delete(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	err := h.channels.Delete(userID, c.Params("id"))
	if err != nil {
		if errors.Is(err, model.ErrNotAuthorized) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "delete failed"})
	}
	return c.SendStatus(fiber.StatusNoContent)
}
