package handler

import (
	"errors"
	"net/url"
	"time"

	"pwdh-aether/internal/model"
	"pwdh-aether/internal/service"

	"github.com/gofiber/fiber/v2"
)

type MessageHandler struct {
	messages *service.MessageService
}

func NewMessageHandler(messages *service.MessageService) *MessageHandler {
	return &MessageHandler{messages: messages}
}

func (h *MessageHandler) Create(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	var req model.CreateMessageRequest
	if err := c.BodyParser(&req); err != nil || req.Content == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "content is required"})
	}

	msg, err := h.messages.Create(userID, c.Params("id"), req)
	if err != nil {
		if errors.Is(err, model.ErrNotMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to send message"})
	}
	return c.Status(fiber.StatusCreated).JSON(msg)
}

func (h *MessageHandler) GetByChannel(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	channelID := c.Params("id")

	var before *time.Time
	if b := c.Query("before"); b != "" {
		decoded, _ := url.QueryUnescape(b)
		t, err := time.Parse(time.RFC3339Nano, decoded)
		if err == nil {
			before = &t
		}
	}

	limit := c.QueryInt("limit", 50)

	messages, err := h.messages.GetByChannelID(userID, channelID, before, limit)
	if err != nil {
		if errors.Is(err, model.ErrNotMember) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch messages"})
	}
	if messages == nil {
		messages = []model.MessageResponse{}
	}
	return c.JSON(messages)
}

func (h *MessageHandler) Update(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	var req model.UpdateMessageRequest
	if err := c.BodyParser(&req); err != nil || req.Content == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "content is required"})
	}

	msg, err := h.messages.Update(userID, c.Params("id"), req.Content)
	if err != nil {
		if errors.Is(err, model.ErrNotAuthorized) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "update failed"})
	}
	return c.JSON(msg)
}

func (h *MessageHandler) Delete(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	err := h.messages.Delete(userID, c.Params("id"))
	if err != nil {
		if errors.Is(err, model.ErrNotAuthorized) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "delete failed"})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *MessageHandler) AddReaction(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	var body struct {
		Emoji string `json:"emoji"`
	}
	if err := c.BodyParser(&body); err != nil || body.Emoji == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "emoji is required"})
	}

	err := h.messages.AddReaction(userID, c.Params("id"), body.Emoji)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "reaction failed"})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *MessageHandler) RemoveReaction(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	emoji, _ := url.QueryUnescape(c.Params("emoji"))
	err := h.messages.RemoveReaction(userID, c.Params("id"), emoji)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "reaction removal failed"})
	}
	return c.SendStatus(fiber.StatusNoContent)
}
