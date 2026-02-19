package repository

import (
	"database/sql"

	"pwdh-aether/internal/model"
)

type ChannelRepository struct {
	db *sql.DB
}

func NewChannelRepository(db *sql.DB) *ChannelRepository {
	return &ChannelRepository{db: db}
}

func (r *ChannelRepository) Create(ch *model.Channel) error {
	query := `INSERT INTO channels (id, guild_id, name, type, category, position) VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := r.db.Exec(query, ch.ID, ch.GuildID, ch.Name, ch.Type, ch.Category, ch.Position)
	return err
}

func (r *ChannelRepository) GetByID(id string) (*model.Channel, error) {
	ch := &model.Channel{}
	query := `SELECT id, guild_id, name, type, category, position, created_at FROM channels WHERE id = $1`
	err := r.db.QueryRow(query, id).Scan(&ch.ID, &ch.GuildID, &ch.Name, &ch.Type, &ch.Category, &ch.Position, &ch.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, model.ErrChannelNotFound
	}
	return ch, err
}

func (r *ChannelRepository) GetByGuildID(guildID string) ([]model.Channel, error) {
	query := `SELECT id, guild_id, name, type, category, position, created_at FROM channels WHERE guild_id = $1 ORDER BY category NULLS FIRST, position, created_at`
	rows, err := r.db.Query(query, guildID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var channels []model.Channel
	for rows.Next() {
		var ch model.Channel
		if err := rows.Scan(&ch.ID, &ch.GuildID, &ch.Name, &ch.Type, &ch.Category, &ch.Position, &ch.CreatedAt); err != nil {
			return nil, err
		}
		channels = append(channels, ch)
	}
	return channels, rows.Err()
}

func (r *ChannelRepository) Update(ch *model.Channel) error {
	query := `UPDATE channels SET name = $2, category = $3, position = $4 WHERE id = $1`
	_, err := r.db.Exec(query, ch.ID, ch.Name, ch.Category, ch.Position)
	return err
}

func (r *ChannelRepository) Delete(id string) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	tx.Exec(`DELETE FROM reactions WHERE message_id IN (SELECT id FROM messages WHERE channel_id = $1)`, id)
	tx.Exec(`DELETE FROM messages WHERE channel_id = $1`, id)
	_, err = tx.Exec(`DELETE FROM channels WHERE id = $1`, id)
	if err != nil {
		return err
	}
	return tx.Commit()
}

func (r *ChannelRepository) GetNextPosition(guildID string) (int, error) {
	var pos int
	query := `SELECT COALESCE(MAX(position), 0) + 1 FROM channels WHERE guild_id = $1`
	err := r.db.QueryRow(query, guildID).Scan(&pos)
	return pos, err
}
