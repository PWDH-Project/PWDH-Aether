package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"pwdh-aether/internal/config"
	"pwdh-aether/internal/database"
	"pwdh-aether/internal/handler"
	"pwdh-aether/internal/ws"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()

	db, err := database.ConnectPostgres(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("postgres: %v", err)
	}
	defer db.Close()

	if err := database.RunMigrations(db, cfg.MigrationsPath); err != nil {
		log.Fatalf("migrations: %v", err)
	}
	log.Println("Migrations applied successfully")

	rdb := database.ConnectRedis(cfg.RedisURL)
	defer rdb.Close()

	minioClient, err := database.ConnectMinio(cfg.MinioEndpoint, cfg.MinioAccessKey, cfg.MinioSecretKey, cfg.MinioUseSSL)
	if err != nil {
		log.Fatalf("minio: %v", err)
	}
	if err := database.EnsureBucket(minioClient, cfg.MinioBucket); err != nil {
		log.Fatalf("minio bucket: %v", err)
	}

	hub := ws.NewHub(rdb)
	go hub.Run()

	app := fiber.New(fiber.Config{
		BodyLimit: 10 * 1024 * 1024,
	})

	router := handler.NewRouter(db, rdb, minioClient, hub, cfg)
	router.Setup(app)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-quit
		log.Println("Shutting down server...")
		_ = app.Shutdown()
	}()

	log.Printf("PWDH-Aether backend listening on :%s", cfg.Port)
	if err := app.Listen(":" + cfg.Port); err != nil {
		log.Fatalf("server: %v", err)
	}
}
