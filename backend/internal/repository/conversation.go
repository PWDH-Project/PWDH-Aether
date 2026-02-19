package repository

import (
	"database/sql"

	"pwdh-aether/internal/model"
)

type ConversationRepository struct {
	db *sql.DB
}

func NewConversationRepository(db *sql.DB) *ConversationRepository {
	return &ConversationRepository{db: db}
}

func (r *ConversationRepository) Create(conv *model.Conversation, memberIDs []string) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Exec(`INSERT INTO conversations (id, is_group, name) VALUES ($1, $2, $3)`, conv.ID, conv.IsGroup, conv.Name)
	if err != nil {
		return err
	}

	for _, uid := range memberIDs {
		_, err = tx.Exec(`INSERT INTO conversation_members (conversation_id, user_id) VALUES ($1, $2)`, conv.ID, uid)
		if err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (r *ConversationRepository) GetByUserID(userID string) ([]model.Conversation, error) {
	query := `SELECT c.id, c.is_group, c.name, c.created_at
		FROM conversations c JOIN conversation_members cm ON c.id = cm.conversation_id
		WHERE cm.user_id = $1 ORDER BY c.created_at DESC`
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var convs []model.Conversation
	for rows.Next() {
		var c model.Conversation
		if err := rows.Scan(&c.ID, &c.IsGroup, &c.Name, &c.CreatedAt); err != nil {
			return nil, err
		}
		convs = append(convs, c)
	}
	return convs, rows.Err()
}

func (r *ConversationRepository) GetByID(id string) (*model.Conversation, error) {
	conv := &model.Conversation{}
	query := `SELECT id, is_group, name, created_at FROM conversations WHERE id = $1`
	err := r.db.QueryRow(query, id).Scan(&conv.ID, &conv.IsGroup, &conv.Name, &conv.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, model.ErrConversationNotFound
	}
	return conv, err
}

func (r *ConversationRepository) IsMember(convID, userID string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM conversation_members WHERE conversation_id = $1 AND user_id = $2)`
	err := r.db.QueryRow(query, convID, userID).Scan(&exists)
	return exists, err
}

func (r *ConversationRepository) GetMembers(convID string) ([]model.User, error) {
	query := `SELECT u.id, u.username, u.email, u.avatar_url, u.created_at
		FROM conversation_members cm JOIN users u ON cm.user_id = u.id WHERE cm.conversation_id = $1`
	rows, err := r.db.Query(query, convID)
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

func (r *ConversationRepository) CreateMessage(msg *model.DirectMessage) error {
	query := `INSERT INTO direct_messages (id, conversation_id, user_id, content, attachment_url) VALUES ($1, $2, $3, $4, $5)`
	_, err := r.db.Exec(query, msg.ID, msg.ConversationID, msg.UserID, msg.Content, msg.AttachmentURL)
	return err
}

func (r *ConversationRepository) GetMessages(convID string, limit int) ([]model.DirectMessage, error) {
	query := `SELECT id, conversation_id, user_id, content, attachment_url, created_at
		FROM direct_messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT $2`
	rows, err := r.db.Query(query, convID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var msgs []model.DirectMessage
	for rows.Next() {
		var m model.DirectMessage
		if err := rows.Scan(&m.ID, &m.ConversationID, &m.UserID, &m.Content, &m.AttachmentURL, &m.CreatedAt); err != nil {
			return nil, err
		}
		msgs = append(msgs, m)
	}
	for i, j := 0, len(msgs)-1; i < j; i, j = i+1, j-1 {
		msgs[i], msgs[j] = msgs[j], msgs[i]
	}
	return msgs, rows.Err()
}

func (r *ConversationRepository) FindDMBetween(userID1, userID2 string) (*model.Conversation, error) {
	query := `SELECT c.id, c.is_group, c.name, c.created_at FROM conversations c
		WHERE c.is_group = FALSE
		AND EXISTS(SELECT 1 FROM conversation_members WHERE conversation_id = c.id AND user_id = $1)
		AND EXISTS(SELECT 1 FROM conversation_members WHERE conversation_id = c.id AND user_id = $2)
		LIMIT 1`
	conv := &model.Conversation{}
	err := r.db.QueryRow(query, userID1, userID2).Scan(&conv.ID, &conv.IsGroup, &conv.Name, &conv.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return conv, err
}
