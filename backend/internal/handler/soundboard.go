package handler

import (
	"pwdh-aether/internal/model"
	"pwdh-aether/internal/repository"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type SoundboardHandler struct {
	clips  *repository.SoundboardRepository
	guilds *repository.GuildRepository
}

func NewSoundboardHandler(clips *repository.SoundboardRepository, guilds *repository.GuildRepository) *SoundboardHandler {
	return &SoundboardHandler{clips: clips, guilds: guilds}
}

func (h *SoundboardHandler) GetByGuild(c *fiber.Ctx) error {
	guildID := c.Params("id")
	clips, err := h.clips.GetByGuildID(guildID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "fetch failed"})
	}
	if clips == nil {
		clips = []model.SoundboardClip{}
	}
	return c.JSON(clips)
}

func (h *SoundboardHandler) Create(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	guildID := c.Params("id")

	var body struct {
		Name    string `json:"name"`
		FileURL string `json:"file_url"`
	}
	if err := c.BodyParser(&body); err != nil || body.Name == "" || body.FileURL == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "name and file_url required"})
	}

	clip := &model.SoundboardClip{
		ID:         uuid.New().String(),
		GuildID:    guildID,
		Name:       body.Name,
		FileURL:    body.FileURL,
		UploadedBy: userID,
	}

	if err := h.clips.Create(clip); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "create failed"})
	}
	return c.Status(fiber.StatusCreated).JSON(clip)
}

func (h *SoundboardHandler) Delete(c *fiber.Ctx) error {
	clipID := c.Params("clipId")
	if err := h.clips.Delete(clipID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "delete failed"})
	}
	return c.SendStatus(fiber.StatusNoContent)
}
