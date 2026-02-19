package handler

import (
	"context"
	"fmt"
	"path/filepath"
	"strings"

	"pwdh-aether/internal/config"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/minio/minio-go/v7"
)

type UploadHandler struct {
	minio  *minio.Client
	cfg    *config.Config
}

func NewUploadHandler(minioClient *minio.Client, cfg *config.Config) *UploadHandler {
	return &UploadHandler{minio: minioClient, cfg: cfg}
}

func (h *UploadHandler) Upload(c *fiber.Ctx) error {
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "file is required"})
	}

	if file.Size > 8*1024*1024 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "file too large (max 8MB)"})
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowed := map[string]bool{
		".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true,
		".mp3": true, ".ogg": true, ".wav": true, ".mp4": true, ".webm": true,
		".txt": true, ".pdf": true, ".zip": true,
	}
	if !allowed[ext] {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "file type not allowed"})
	}

	src, err := file.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to read file"})
	}
	defer src.Close()

	objectName := fmt.Sprintf("%s%s", uuid.New().String(), ext)
	contentType := file.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	_, err = h.minio.PutObject(
		context.Background(),
		h.cfg.MinioBucket,
		objectName,
		src,
		file.Size,
		minio.PutObjectOptions{ContentType: contentType},
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "upload failed"})
	}

	scheme := "http"
	if h.cfg.MinioUseSSL {
		scheme = "https"
	}
	fileURL := fmt.Sprintf("%s://%s/%s/%s", scheme, h.cfg.MinioEndpoint, h.cfg.MinioBucket, objectName)

	return c.JSON(fiber.Map{"url": fileURL})
}
