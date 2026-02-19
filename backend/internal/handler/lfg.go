package handler

import (
	"time"

	"pwdh-aether/internal/model"
	"pwdh-aether/internal/repository"
	"pwdh-aether/internal/ws"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type LFGHandler struct {
	lfg    *repository.LFGRepository
	users  *repository.UserRepository
	guilds *repository.GuildRepository
	hub    *ws.Hub
}

func NewLFGHandler(lfg *repository.LFGRepository, users *repository.UserRepository, guilds *repository.GuildRepository, hub *ws.Hub) *LFGHandler {
	return &LFGHandler{lfg: lfg, users: users, guilds: guilds, hub: hub}
}

func (h *LFGHandler) GetByGuild(c *fiber.Ctx) error {
	guildID := c.Params("id")
	posts, err := h.lfg.GetByGuildID(guildID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to fetch LFG posts"})
	}

	var responses []model.LFGPostResponse
	for _, p := range posts {
		creator, _ := h.users.GetByID(p.UserID)
		participants, _ := h.lfg.GetParticipants(p.ID)

		resp := model.LFGPostResponse{LFGPost: p}
		if creator != nil {
			resp.Creator = creator.ToResponse()
		}
		for _, u := range participants {
			resp.Participants = append(resp.Participants, u.ToResponse())
		}
		if resp.Participants == nil {
			resp.Participants = []model.UserResponse{}
		}
		responses = append(responses, resp)
	}
	if responses == nil {
		responses = []model.LFGPostResponse{}
	}
	return c.JSON(responses)
}

func (h *LFGHandler) Create(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	guildID := c.Params("id")

	var req model.CreateLFGRequest
	if err := c.BodyParser(&req); err != nil || req.GameName == "" || req.SlotsTotal < 2 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "game_name and slots_total (>= 2) required"})
	}

	post := &model.LFGPost{
		ID:          uuid.New().String(),
		GuildID:     guildID,
		UserID:      userID,
		GameName:    req.GameName,
		Description: req.Description,
		SlotsTotal:  req.SlotsTotal,
		SlotsFilled: 1,
		ExpiresAt:   time.Now().Add(time.Duration(req.ExpiresIn) * time.Minute),
	}

	if err := h.lfg.Create(post); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "create failed"})
	}

	h.hub.BroadcastToGuild(guildID, ws.Event{Type: ws.EventLFGCreate, Data: post})
	return c.Status(fiber.StatusCreated).JSON(post)
}

func (h *LFGHandler) Join(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	lfgID := c.Params("lfgId")

	post, err := h.lfg.GetByID(lfgID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "LFG post not found"})
	}
	if post.SlotsFilled >= post.SlotsTotal {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "LFG post is full"})
	}

	if err := h.lfg.Join(lfgID, userID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "join failed"})
	}

	h.hub.BroadcastToGuild(post.GuildID, ws.Event{Type: ws.EventLFGUpdate, Data: post})
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *LFGHandler) Leave(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	lfgID := c.Params("lfgId")

	if err := h.lfg.Leave(lfgID, userID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "leave failed"})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *LFGHandler) Delete(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	lfgID := c.Params("lfgId")

	post, err := h.lfg.GetByID(lfgID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "not found"})
	}
	if post.UserID != userID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "not authorized"})
	}

	if err := h.lfg.Delete(lfgID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "delete failed"})
	}

	h.hub.BroadcastToGuild(post.GuildID, ws.Event{Type: ws.EventLFGDelete, Data: map[string]string{"id": lfgID}})
	return c.SendStatus(fiber.StatusNoContent)
}
