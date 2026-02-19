package repository

import (
	"database/sql"

	"pwdh-aether/internal/model"
)

type LFGRepository struct {
	db *sql.DB
}

func NewLFGRepository(db *sql.DB) *LFGRepository {
	return &LFGRepository{db: db}
}

func (r *LFGRepository) Create(post *model.LFGPost) error {
	query := `INSERT INTO lfg_posts (id, guild_id, user_id, game_name, description, slots_total, slots_filled, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
	_, err := r.db.Exec(query, post.ID, post.GuildID, post.UserID, post.GameName, post.Description, post.SlotsTotal, post.SlotsFilled, post.ExpiresAt)
	return err
}

func (r *LFGRepository) GetByGuildID(guildID string) ([]model.LFGPost, error) {
	query := `SELECT id, guild_id, user_id, game_name, description, slots_total, slots_filled, expires_at, created_at
		FROM lfg_posts WHERE guild_id = $1 AND expires_at > NOW() ORDER BY created_at DESC`
	rows, err := r.db.Query(query, guildID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []model.LFGPost
	for rows.Next() {
		var p model.LFGPost
		if err := rows.Scan(&p.ID, &p.GuildID, &p.UserID, &p.GameName, &p.Description, &p.SlotsTotal, &p.SlotsFilled, &p.ExpiresAt, &p.CreatedAt); err != nil {
			return nil, err
		}
		posts = append(posts, p)
	}
	return posts, rows.Err()
}

func (r *LFGRepository) GetByID(id string) (*model.LFGPost, error) {
	post := &model.LFGPost{}
	query := `SELECT id, guild_id, user_id, game_name, description, slots_total, slots_filled, expires_at, created_at
		FROM lfg_posts WHERE id = $1`
	err := r.db.QueryRow(query, id).Scan(&post.ID, &post.GuildID, &post.UserID, &post.GameName, &post.Description, &post.SlotsTotal, &post.SlotsFilled, &post.ExpiresAt, &post.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, model.ErrNotFound
	}
	return post, err
}

func (r *LFGRepository) Join(lfgID, userID string) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Exec(`INSERT INTO lfg_participants (lfg_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, lfgID, userID)
	if err != nil {
		return err
	}
	_, err = tx.Exec(`UPDATE lfg_posts SET slots_filled = (SELECT COUNT(*) FROM lfg_participants WHERE lfg_id = $1) + 1 WHERE id = $1`, lfgID)
	if err != nil {
		return err
	}
	return tx.Commit()
}

func (r *LFGRepository) Leave(lfgID, userID string) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Exec(`DELETE FROM lfg_participants WHERE lfg_id = $1 AND user_id = $2`, lfgID, userID)
	if err != nil {
		return err
	}
	_, err = tx.Exec(`UPDATE lfg_posts SET slots_filled = (SELECT COUNT(*) FROM lfg_participants WHERE lfg_id = $1) + 1 WHERE id = $1`, lfgID)
	if err != nil {
		return err
	}
	return tx.Commit()
}

func (r *LFGRepository) Delete(id string) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	tx.Exec(`DELETE FROM lfg_participants WHERE lfg_id = $1`, id)
	_, err = tx.Exec(`DELETE FROM lfg_posts WHERE id = $1`, id)
	if err != nil {
		return err
	}
	return tx.Commit()
}

func (r *LFGRepository) GetParticipants(lfgID string) ([]model.User, error) {
	query := `SELECT u.id, u.username, u.email, u.avatar_url, u.created_at
		FROM lfg_participants lp JOIN users u ON lp.user_id = u.id WHERE lp.lfg_id = $1`
	rows, err := r.db.Query(query, lfgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []model.User
	for rows.Next() {
		var u model.User
		if err := rows.Scan(&u.ID, &u.Username, &u.Email, &u.AvatarURL, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}
