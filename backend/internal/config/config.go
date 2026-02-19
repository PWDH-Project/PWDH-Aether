package config

import (
	"os"
	"time"
)

type Config struct {
	Port           string
	DatabaseURL    string
	MigrationsPath string
	RedisURL       string

	JWTSecret string
	JWTExpiry time.Duration

	FrontendURL string

	MinioEndpoint  string
	MinioAccessKey string
	MinioSecretKey string
	MinioBucket    string
	MinioUseSSL    bool

	LiveKitHost      string
	LiveKitPublicURL string
	LiveKitAPIKey    string
	LiveKitAPISecret string
}

func Load() *Config {
	return &Config{
		Port:           env("PORT", "8080"),
		DatabaseURL:    env("DATABASE_URL", "postgres://aether:aether_dev@localhost:5432/aether?sslmode=disable"),
		MigrationsPath: env("MIGRATIONS_PATH", "./migrations"),
		RedisURL:       env("REDIS_URL", "redis://localhost:6379"),

		JWTSecret: env("JWT_SECRET", "dev-secret-change-in-production"),
		JWTExpiry: duration(env("JWT_EXPIRY", "24h")),

		FrontendURL: env("FRONTEND_URL", "http://localhost:3000"),

		MinioEndpoint:  env("MINIO_ENDPOINT", "localhost:9000"),
		MinioAccessKey: env("MINIO_ACCESS_KEY", "minioadmin"),
		MinioSecretKey: env("MINIO_SECRET_KEY", "minioadmin"),
		MinioBucket:    env("MINIO_BUCKET", "aether"),
		MinioUseSSL:    env("MINIO_USE_SSL", "false") == "true",

		LiveKitHost:      env("LIVEKIT_HOST", "http://localhost:7880"),
		LiveKitPublicURL: env("LIVEKIT_PUBLIC_URL", "ws://localhost:7880"),
		LiveKitAPIKey:    env("LIVEKIT_API_KEY", "devkey"),
		LiveKitAPISecret: env("LIVEKIT_API_SECRET", "secret"),
	}
}

func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func duration(s string) time.Duration {
	d, err := time.ParseDuration(s)
	if err != nil {
		return 24 * time.Hour
	}
	return d
}
