package repository

import (
	"database/sql"

	"pwdh-aether/internal/model"
)

type SoundboardRepository struct {
	db *sql.DB
}

func NewSoundboardRepository(db *sql.DB) *SoundboardRepository {
	return &SoundboardRepository{db: db}
}

func (r *SoundboardRepository) Create(clip *model.SoundboardClip) error {
	query := `INSERT INTO soundboard_clips (id, guild_id, name, file_url, uploaded_by) VALUES ($1, $2, $3, $4, $5)`
	_, err := r.db.Exec(query, clip.ID, clip.GuildID, clip.Name, clip.FileURL, clip.UploadedBy)
	return err
}

func (r *SoundboardRepository) GetByGuildID(guildID string) ([]model.SoundboardClip, error) {
	query := `SELECT id, guild_id, name, file_url, uploaded_by, created_at FROM soundboard_clips WHERE guild_id = $1 ORDER BY name`
	rows, err := r.db.Query(query, guildID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var clips []model.SoundboardClip
	for rows.Next() {
		var c model.SoundboardClip
		if err := rows.Scan(&c.ID, &c.GuildID, &c.Name, &c.FileURL, &c.UploadedBy, &c.CreatedAt); err != nil {
			return nil, err
		}
		clips = append(clips, c)
	}
	return clips, rows.Err()
}

func (r *SoundboardRepository) Delete(id string) error {
	_, err := r.db.Exec(`DELETE FROM soundboard_clips WHERE id = $1`, id)
	return err
}

func (r *SoundboardRepository) GetByID(id string) (*model.SoundboardClip, error) {
	clip := &model.SoundboardClip{}
	query := `SELECT id, guild_id, name, file_url, uploaded_by, created_at FROM soundboard_clips WHERE id = $1`
	err := r.db.QueryRow(query, id).Scan(&clip.ID, &clip.GuildID, &clip.Name, &clip.FileURL, &clip.UploadedBy, &clip.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, model.ErrNotFound
	}
	return clip, err
}
