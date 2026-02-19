package service

import (
	"fmt"
	"time"

	"pwdh-aether/internal/config"
	"pwdh-aether/internal/model"
	"pwdh-aether/internal/repository"

	"github.com/alexedwards/argon2id"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type AuthService struct {
	users *repository.UserRepository
	cfg   *config.Config
}

func NewAuthService(users *repository.UserRepository, cfg *config.Config) *AuthService {
	return &AuthService{users: users, cfg: cfg}
}

func (s *AuthService) Register(req model.RegisterRequest) (*model.TokenResponse, error) {
	if taken, _ := s.users.EmailExists(req.Email); taken {
		return nil, model.ErrEmailTaken
	}
	if taken, _ := s.users.UsernameExists(req.Username); taken {
		return nil, model.ErrUsernameTaken
	}

	hash, err := argon2id.CreateHash(req.Password, argon2id.DefaultParams)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	user := &model.User{
		ID:           uuid.New().String(),
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: hash,
	}
	if err := s.users.Create(user); err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}

	token, err := s.generateToken(user.ID)
	if err != nil {
		return nil, err
	}

	userResp := user.ToResponse()
	return &model.TokenResponse{AccessToken: token, User: userResp}, nil
}

func (s *AuthService) Login(req model.LoginRequest) (*model.TokenResponse, error) {
	user, err := s.users.GetByEmail(req.Email)
	if err != nil {
		return nil, model.ErrInvalidCredentials
	}

	match, err := argon2id.ComparePasswordAndHash(req.Password, user.PasswordHash)
	if err != nil || !match {
		return nil, model.ErrInvalidCredentials
	}

	token, err := s.generateToken(user.ID)
	if err != nil {
		return nil, err
	}

	userResp := user.ToResponse()
	return &model.TokenResponse{AccessToken: token, User: userResp}, nil
}

func (s *AuthService) generateToken(userID string) (string, error) {
	claims := jwt.MapClaims{
		"sub": userID,
		"exp": time.Now().Add(s.cfg.JWTExpiry).Unix(),
		"iat": time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.cfg.JWTSecret))
}
