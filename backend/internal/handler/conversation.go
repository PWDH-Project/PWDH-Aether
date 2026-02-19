package handler

import (
	"pwdh-aether/internal/model"
	"pwdh-aether/internal/repository"
	"pwdh-aether/internal/ws"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type ConversationHandler struct {
	convs *repository.ConversationRepository
	users *repository.UserRepository
	hub   *ws.Hub
}

func NewConversationHandler(convs *repository.ConversationRepository, users *repository.UserRepository, hub *ws.Hub) *ConversationHandler {
	return &ConversationHandler{convs: convs, users: users, hub: hub}
}

func (h *ConversationHandler) GetMyConversations(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	convs, err := h.convs.GetByUserID(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "fetch failed"})
	}

	var responses []model.ConversationResponse
	for _, conv := range convs {
		members, _ := h.convs.GetMembers(conv.ID)
		var memberResponses []model.UserResponse
		for _, m := range members {
			memberResponses = append(memberResponses, m.ToResponse())
		}
		responses = append(responses, model.ConversationResponse{
			ID:        conv.ID,
			IsGroup:   conv.IsGroup,
			Name:      conv.Name,
			Members:   memberResponses,
			CreatedAt: conv.CreatedAt,
		})
	}
	if responses == nil {
		responses = []model.ConversationResponse{}
	}
	return c.JSON(responses)
}

func (h *ConversationHandler) Create(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	var req model.CreateConversationRequest
	if err := c.BodyParser(&req); err != nil || len(req.UserIDs) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "user_ids required"})
	}

	if len(req.UserIDs) == 1 {
		existing, _ := h.convs.FindDMBetween(userID, req.UserIDs[0])
		if existing != nil {
			return c.JSON(existing)
		}
	}

	conv := &model.Conversation{
		ID:      uuid.New().String(),
		IsGroup: len(req.UserIDs) > 1,
		Name:    req.Name,
	}

	allMembers := append([]string{userID}, req.UserIDs...)
	if err := h.convs.Create(conv, allMembers); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "create failed"})
	}
	return c.Status(fiber.StatusCreated).JSON(conv)
}

func (h *ConversationHandler) GetMessages(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	convID := c.Params("id")

	isMember, _ := h.convs.IsMember(convID, userID)
	if !isMember {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "not a member"})
	}

	limit := c.QueryInt("limit", 50)
	msgs, err := h.convs.GetMessages(convID, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "fetch failed"})
	}

	var responses []model.DMResponse
	for _, msg := range msgs {
		user, _ := h.users.GetByID(msg.UserID)
		resp := model.DMResponse{
			ID:             msg.ID,
			ConversationID: msg.ConversationID,
			Content:        msg.Content,
			AttachmentURL:  msg.AttachmentURL,
			CreatedAt:      msg.CreatedAt,
		}
		if user != nil {
			resp.User = user.ToResponse()
		}
		responses = append(responses, resp)
	}
	if responses == nil {
		responses = []model.DMResponse{}
	}
	return c.JSON(responses)
}

func (h *ConversationHandler) SendMessage(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	convID := c.Params("id")

	isMember, _ := h.convs.IsMember(convID, userID)
	if !isMember {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "not a member"})
	}

	var req model.CreateDMRequest
	if err := c.BodyParser(&req); err != nil || req.Content == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "content required"})
	}

	msg := &model.DirectMessage{
		ID:             uuid.New().String(),
		ConversationID: convID,
		UserID:         userID,
		Content:        req.Content,
		AttachmentURL:  req.AttachmentURL,
	}

	if err := h.convs.CreateMessage(msg); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "send failed"})
	}

	user, _ := h.users.GetByID(userID)
	resp := model.DMResponse{
		ID:             msg.ID,
		ConversationID: convID,
		Content:        msg.Content,
		AttachmentURL:  msg.AttachmentURL,
		CreatedAt:      msg.CreatedAt,
	}
	if user != nil {
		resp.User = user.ToResponse()
	}

	h.hub.BroadcastToRoom("dm:"+convID, ws.Event{
		Type: ws.EventMessageCreate,
		Data: resp,
	})

	return c.Status(fiber.StatusCreated).JSON(resp)
}
