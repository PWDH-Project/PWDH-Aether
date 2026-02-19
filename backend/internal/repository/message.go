package repository

import (
	"database/sql"
	"time"

	"pwdh-aether/internal/model"
)

type MessageRepository struct {
	db *sql.DB
}

func NewMessageRepository(db *sql.DB) *MessageRepository {
	return &MessageRepository{db: db}
}

func (r *MessageRepository) Create(msg *model.Message) error {
	query := `INSERT INTO messages (id, channel_id, user_id, content, attachment_url) VALUES ($1, $2, $3, $4, $5)`
	_, err := r.db.Exec(query, msg.ID, msg.ChannelID, msg.UserID, msg.Content, msg.AttachmentURL)
	return err
}

func (r *MessageRepository) GetByID(id string) (*model.Message, error) {
	msg := &model.Message{}
	query := `SELECT id, channel_id, user_id, content, attachment_url, created_at, updated_at FROM messages WHERE id = $1`
	err := r.db.QueryRow(query, id).Scan(&msg.ID, &msg.ChannelID, &msg.UserID, &msg.Content, &msg.AttachmentURL, &msg.CreatedAt, &msg.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, model.ErrMessageNotFound
	}
	return msg, err
}

func (r *MessageRepository) GetByChannelID(channelID string, before *time.Time, limit int) ([]model.MessageResponse, error) {
	var rows *sql.Rows
	var err error

	if before != nil {
		query := `SELECT m.id, m.channel_id, m.content, m.attachment_url, m.created_at, m.updated_at,
				u.id, u.username, u.email, u.avatar_url, u.created_at
			FROM messages m JOIN users u ON m.user_id = u.id
			WHERE m.channel_id = $1 AND m.created_at < $2
			ORDER BY m.created_at DESC LIMIT $3`
		rows, err = r.db.Query(query, channelID, before, limit)
	} else {
		query := `SELECT m.id, m.channel_id, m.content, m.attachment_url, m.created_at, m.updated_at,
				u.id, u.username, u.email, u.avatar_url, u.created_at
			FROM messages m JOIN users u ON m.user_id = u.id
			WHERE m.channel_id = $1
			ORDER BY m.created_at DESC LIMIT $2`
		rows, err = r.db.Query(query, channelID, limit)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []model.MessageResponse
	for rows.Next() {
		var msg model.MessageResponse
		var u model.User
		if err := rows.Scan(
			&msg.ID, &msg.ChannelID, &msg.Content, &msg.AttachmentURL, &msg.CreatedAt, &msg.UpdatedAt,
			&u.ID, &u.Username, &u.Email, &u.AvatarURL, &u.CreatedAt,
		); err != nil {
			return nil, err
		}
		msg.User = u.ToResponse()
		msg.Reactions = []model.Reaction{}
		messages = append(messages, msg)
	}

	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}
	return messages, rows.Err()
}

func (r *MessageRepository) Update(id, content string) error {
	query := `UPDATE messages SET content = $2, updated_at = NOW() WHERE id = $1`
	_, err := r.db.Exec(query, id, content)
	return err
}

func (r *MessageRepository) Delete(id string) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	tx.Exec(`DELETE FROM reactions WHERE message_id = $1`, id)
	_, err = tx.Exec(`DELETE FROM messages WHERE id = $1`, id)
	if err != nil {
		return err
	}
	return tx.Commit()
}

func (r *MessageRepository) AddReaction(messageID, userID, emoji string) error {
	query := `INSERT INTO reactions (id, message_id, user_id, emoji) VALUES (gen_random_uuid(), $1, $2, $3) ON CONFLICT (message_id, user_id, emoji) DO NOTHING`
	_, err := r.db.Exec(query, messageID, userID, emoji)
	return err
}

func (r *MessageRepository) RemoveReaction(messageID, userID, emoji string) error {
	query := `DELETE FROM reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3`
	_, err := r.db.Exec(query, messageID, userID, emoji)
	return err
}

func (r *MessageRepository) GetReactions(messageID, currentUserID string) ([]model.Reaction, error) {
	query := `SELECT emoji, COUNT(*) as count,
		BOOL_OR(user_id = $2) as me
		FROM reactions WHERE message_id = $1 GROUP BY emoji`
	rows, err := r.db.Query(query, messageID, currentUserID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reactions []model.Reaction
	for rows.Next() {
		var r model.Reaction
		if err := rows.Scan(&r.Emoji, &r.Count, &r.Me); err != nil {
			return nil, err
		}
		reactions = append(reactions, r)
	}
	return reactions, rows.Err()
}
