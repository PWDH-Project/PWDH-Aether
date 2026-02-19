package handler

import (
	"time"

	"pwdh-aether/internal/config"
	"pwdh-aether/internal/repository"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

type LiveKitHandler struct {
	cfg    *config.Config
	guilds *repository.GuildRepository
	users  *repository.UserRepository
}

func NewLiveKitHandler(cfg *config.Config, guilds *repository.GuildRepository, users *repository.UserRepository) *LiveKitHandler {
	return &LiveKitHandler{cfg: cfg, guilds: guilds, users: users}
}

type VideoGrant struct {
	RoomJoin  bool   `json:"roomJoin"`
	Room      string `json:"room"`
	CanPublish     *bool `json:"canPublish,omitempty"`
	CanSubscribe   *bool `json:"canSubscribe,omitempty"`
	CanPublishData *bool `json:"canPublishData,omitempty"`
}

type LiveKitClaims struct {
	Video    VideoGrant        `json:"video"`
	Metadata string            `json:"metadata,omitempty"`
	Name     string            `json:"name,omitempty"`
	jwt.RegisteredClaims
}

func (h *LiveKitHandler) GetToken(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	channelID := c.Params("id")

	user, err := h.users.GetByID(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "user not found"})
	}

	boolTrue := true
	claims := LiveKitClaims{
		Video: VideoGrant{
			RoomJoin:       true,
			Room:           channelID,
			CanPublish:     &boolTrue,
			CanSubscribe:   &boolTrue,
			CanPublishData: &boolTrue,
		},
		Name: user.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    h.cfg.LiveKitAPIKey,
			Subject:   userID,
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(6 * time.Hour)),
			NotBefore: jwt.NewNumericDate(time.Now()),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ID:        userID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(h.cfg.LiveKitAPISecret))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to generate token"})
	}

	return c.JSON(fiber.Map{
		"token":    tokenString,
		"url":      h.cfg.LiveKitPublicURL,
		"room":     channelID,
		"identity": userID,
		"name":     user.Username,
	})
}
