package handler

import (
	"database/sql"
	"strings"

	"pwdh-aether/internal/config"
	"pwdh-aether/internal/middleware"
	"pwdh-aether/internal/repository"
	"pwdh-aether/internal/service"
	"pwdh-aether/internal/ws"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/minio/minio-go/v7"
	"github.com/redis/go-redis/v9"
)

type Router struct {
	auth         *AuthHandler
	user         *UserHandler
	guild        *GuildHandler
	channel      *ChannelHandler
	message      *MessageHandler
	upload       *UploadHandler
	livekit      *LiveKitHandler
	lfg          *LFGHandler
	soundboard   *SoundboardHandler
	presence     *PresenceHandler
	conversation *ConversationHandler
	hub          *ws.Hub
	cfg          *config.Config
}

func NewRouter(db *sql.DB, rdb *redis.Client, minioClient *minio.Client, hub *ws.Hub, cfg *config.Config) *Router {
	userRepo := repository.NewUserRepository(db)
	guildRepo := repository.NewGuildRepository(db)
	channelRepo := repository.NewChannelRepository(db)
	messageRepo := repository.NewMessageRepository(db)
	lfgRepo := repository.NewLFGRepository(db)
	soundboardRepo := repository.NewSoundboardRepository(db)
	presenceRepo := repository.NewPresenceRepository(db)
	convRepo := repository.NewConversationRepository(db)

	authService := service.NewAuthService(userRepo, cfg)
	guildService := service.NewGuildService(guildRepo, channelRepo)
	channelService := service.NewChannelService(channelRepo, guildRepo)
	messageService := service.NewMessageService(messageRepo, userRepo, guildRepo, channelRepo, hub)

	return &Router{
		auth:         NewAuthHandler(authService),
		user:         NewUserHandler(userRepo),
		guild:        NewGuildHandler(guildService),
		channel:      NewChannelHandler(channelService),
		message:      NewMessageHandler(messageService),
		upload:       NewUploadHandler(minioClient, cfg),
		livekit:      NewLiveKitHandler(cfg, guildRepo, userRepo),
		lfg:          NewLFGHandler(lfgRepo, userRepo, guildRepo, hub),
		soundboard:   NewSoundboardHandler(soundboardRepo, guildRepo),
		presence:     NewPresenceHandler(presenceRepo),
		conversation: NewConversationHandler(convRepo, userRepo, hub),
		hub:          hub,
		cfg:          cfg,
	}
}

func (r *Router) Setup(app *fiber.App) {
	middleware.Setup(app, r.cfg)

	auth := app.Group("/api/auth")
	auth.Post("/register", r.auth.Register)
	auth.Post("/login", r.auth.Login)

	api := app.Group("/api", middleware.AuthRequired(r.cfg.JWTSecret))

	api.Get("/users/@me", r.user.GetMe)
	api.Patch("/users/@me", r.user.UpdateMe)

	api.Get("/guilds", r.guild.GetMyGuilds)
	api.Post("/guilds", r.guild.Create)
	api.Post("/guilds/join", r.guild.Join)
	api.Get("/guilds/:id", r.guild.GetByID)
	api.Patch("/guilds/:id", r.guild.Update)
	api.Delete("/guilds/:id", r.guild.Delete)
	api.Post("/guilds/:id/leave", r.guild.Leave)
	api.Get("/guilds/:id/members", r.guild.GetMembers)
	api.Delete("/guilds/:id/members/:userId", r.guild.KickMember)
	api.Patch("/guilds/:id/roles", r.guild.UpdateMemberRole)

	api.Get("/guilds/:id/channels", r.channel.GetByGuild)
	api.Post("/guilds/:id/channels", r.channel.Create)
	api.Patch("/channels/:id", r.channel.Update)
	api.Delete("/channels/:id", r.channel.Delete)

	api.Get("/channels/:id/messages", r.message.GetByChannel)
	api.Post("/channels/:id/messages", r.message.Create)
	api.Patch("/messages/:id", r.message.Update)
	api.Delete("/messages/:id", r.message.Delete)
	api.Post("/messages/:id/reactions", r.message.AddReaction)
	api.Delete("/messages/:id/reactions/:emoji", r.message.RemoveReaction)

	api.Post("/upload", r.upload.Upload)

	api.Get("/channels/:id/livekit-token", r.livekit.GetToken)

	// LFG
	api.Get("/guilds/:id/lfg", r.lfg.GetByGuild)
	api.Post("/guilds/:id/lfg", r.lfg.Create)
	api.Post("/lfg/:lfgId/join", r.lfg.Join)
	api.Post("/lfg/:lfgId/leave", r.lfg.Leave)
	api.Delete("/lfg/:lfgId", r.lfg.Delete)

	// Soundboard
	api.Get("/guilds/:id/soundboard", r.soundboard.GetByGuild)
	api.Post("/guilds/:id/soundboard", r.soundboard.Create)
	api.Delete("/soundboard/:clipId", r.soundboard.Delete)

	// Presence
	api.Get("/presence", r.presence.Get)
	api.Patch("/presence", r.presence.Update)
	api.Get("/guilds/:id/presence", r.presence.GetByGuild)

	// Conversations / DMs
	api.Get("/conversations", r.conversation.GetMyConversations)
	api.Post("/conversations", r.conversation.Create)
	api.Get("/conversations/:id/messages", r.conversation.GetMessages)
	api.Post("/conversations/:id/messages", r.conversation.SendMessage)

	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			token := c.Query("token")
			if token == "" {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "token required"})
			}
			userID, err := r.parseToken(token)
			if err != nil {
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "invalid token"})
			}
			c.Locals("userID", userID)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})

	app.Get("/ws", websocket.New(func(c *websocket.Conn) {
		userID := c.Locals("userID").(string)
		ws.ServeWs(r.hub, c, userID)
	}))

	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})
}

func (r *Router) parseToken(tokenString string) (string, error) {
	tokenString = strings.TrimPrefix(tokenString, "Bearer ")
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		return []byte(r.cfg.JWTSecret), nil
	})
	if err != nil || !token.Valid {
		return "", err
	}
	claims := token.Claims.(jwt.MapClaims)
	return claims["sub"].(string), nil
}
