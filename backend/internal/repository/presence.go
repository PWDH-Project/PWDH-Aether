package repository

import (
	"database/sql"

	"pwdh-aether/internal/model"
)

type PresenceRepository struct {
	db *sql.DB
}

func NewPresenceRepository(db *sql.DB) *PresenceRepository {
	return &PresenceRepository{db: db}
}

func (r *PresenceRepository) Upsert(presence *model.UserPresence) error {
	query := `INSERT INTO user_presence (user_id, status, game_name, game_started_at, custom_status, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
		ON CONFLICT (user_id) DO UPDATE SET
			status = EXCLUDED.status,
			game_name = EXCLUDED.game_name,
			game_started_at = EXCLUDED.game_started_at,
			custom_status = EXCLUDED.custom_status,
			updated_at = NOW()`
	_, err := r.db.Exec(query, presence.UserID, presence.Status, presence.GameName, presence.GameStartedAt, presence.CustomStatus)
	return err
}

func (r *PresenceRepository) GetByUserID(userID string) (*model.UserPresence, error) {
	p := &model.UserPresence{}
	query := `SELECT user_id, status, game_name, game_started_at, custom_status, updated_at FROM user_presence WHERE user_id = $1`
	err := r.db.QueryRow(query, userID).Scan(&p.UserID, &p.Status, &p.GameName, &p.GameStartedAt, &p.CustomStatus, &p.UpdatedAt)
	if err == sql.ErrNoRows {
		return &model.UserPresence{UserID: userID, Status: model.StatusOffline}, nil
	}
	return p, err
}

func (r *PresenceRepository) GetByGuildID(guildID string) ([]model.UserPresence, error) {
	query := `SELECT up.user_id, up.status, up.game_name, up.game_started_at, up.custom_status, up.updated_at
		FROM user_presence up JOIN members m ON up.user_id = m.user_id WHERE m.guild_id = $1`
	rows, err := r.db.Query(query, guildID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var presences []model.UserPresence
	for rows.Next() {
		var p model.UserPresence
		if err := rows.Scan(&p.UserID, &p.Status, &p.GameName, &p.GameStartedAt, &p.CustomStatus, &p.UpdatedAt); err != nil {
			return nil, err
		}
		presences = append(presences, p)
	}
	return presences, rows.Err()
}

func (r *PresenceRepository) SetOffline(userID string) error {
	query := `UPDATE user_presence SET status = 'OFFLINE', game_name = NULL, game_started_at = NULL, updated_at = NOW() WHERE user_id = $1`
	_, err := r.db.Exec(query, userID)
	return err
}
