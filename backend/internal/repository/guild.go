package repository

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"

	"pwdh-aether/internal/model"
)

type GuildRepository struct {
	db *sql.DB
}

func NewGuildRepository(db *sql.DB) *GuildRepository {
	return &GuildRepository{db: db}
}

func (r *GuildRepository) Create(guild *model.Guild) error {
	if guild.InviteCode == "" {
		guild.InviteCode = generateInviteCode()
	}
	query := `INSERT INTO guilds (id, name, icon_url, owner_id, invite_code) VALUES ($1, $2, $3, $4, $5)`
	_, err := r.db.Exec(query, guild.ID, guild.Name, guild.IconURL, guild.OwnerID, guild.InviteCode)
	return err
}

func (r *GuildRepository) GetByID(id string) (*model.Guild, error) {
	g := &model.Guild{}
	query := `SELECT id, name, icon_url, owner_id, invite_code, created_at FROM guilds WHERE id = $1`
	err := r.db.QueryRow(query, id).Scan(&g.ID, &g.Name, &g.IconURL, &g.OwnerID, &g.InviteCode, &g.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, model.ErrGuildNotFound
	}
	return g, err
}

func (r *GuildRepository) GetByUserID(userID string) ([]model.Guild, error) {
	query := `SELECT g.id, g.name, g.icon_url, g.owner_id, g.invite_code, g.created_at
		FROM guilds g JOIN members m ON g.id = m.guild_id WHERE m.user_id = $1 ORDER BY g.created_at`
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var guilds []model.Guild
	for rows.Next() {
		var g model.Guild
		if err := rows.Scan(&g.ID, &g.Name, &g.IconURL, &g.OwnerID, &g.InviteCode, &g.CreatedAt); err != nil {
			return nil, err
		}
		guilds = append(guilds, g)
	}
	return guilds, rows.Err()
}

func (r *GuildRepository) Update(guild *model.Guild) error {
	query := `UPDATE guilds SET name = $2, icon_url = $3 WHERE id = $1`
	_, err := r.db.Exec(query, guild.ID, guild.Name, guild.IconURL)
	return err
}

func (r *GuildRepository) Delete(id string) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	tx.Exec(`DELETE FROM reactions WHERE message_id IN (SELECT id FROM messages WHERE channel_id IN (SELECT id FROM channels WHERE guild_id = $1))`, id)
	tx.Exec(`DELETE FROM messages WHERE channel_id IN (SELECT id FROM channels WHERE guild_id = $1)`, id)
	tx.Exec(`DELETE FROM channels WHERE guild_id = $1`, id)
	tx.Exec(`DELETE FROM lfg_participants WHERE lfg_id IN (SELECT id FROM lfg_posts WHERE guild_id = $1)`, id)
	tx.Exec(`DELETE FROM lfg_posts WHERE guild_id = $1`, id)
	tx.Exec(`DELETE FROM soundboard_clips WHERE guild_id = $1`, id)
	tx.Exec(`DELETE FROM invites WHERE guild_id = $1`, id)
	tx.Exec(`DELETE FROM members WHERE guild_id = $1`, id)
	_, err = tx.Exec(`DELETE FROM guilds WHERE id = $1`, id)
	if err != nil {
		return err
	}
	return tx.Commit()
}

func (r *GuildRepository) AddMember(guildID, userID, role string) error {
	query := `INSERT INTO members (user_id, guild_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`
	_, err := r.db.Exec(query, userID, guildID, role)
	return err
}

func (r *GuildRepository) RemoveMember(guildID, userID string) error {
	query := `DELETE FROM members WHERE guild_id = $1 AND user_id = $2`
	_, err := r.db.Exec(query, guildID, userID)
	return err
}

func (r *GuildRepository) GetMember(guildID, userID string) (*model.Member, error) {
	m := &model.Member{}
	query := `SELECT user_id, guild_id, role, joined_at FROM members WHERE guild_id = $1 AND user_id = $2`
	err := r.db.QueryRow(query, guildID, userID).Scan(&m.UserID, &m.GuildID, &m.Role, &m.JoinedAt)
	if err == sql.ErrNoRows {
		return nil, model.ErrNotMember
	}
	return m, err
}

func (r *GuildRepository) GetMembers(guildID string) ([]model.MemberResponse, error) {
	query := `SELECT u.id, u.username, u.email, u.avatar_url, u.created_at, m.role, m.joined_at
		FROM members m JOIN users u ON m.user_id = u.id WHERE m.guild_id = $1 ORDER BY m.role, u.username`
	rows, err := r.db.Query(query, guildID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var members []model.MemberResponse
	for rows.Next() {
		var mr model.MemberResponse
		var u model.User
		if err := rows.Scan(&u.ID, &u.Username, &u.Email, &u.AvatarURL, &u.CreatedAt, &mr.Role, &mr.JoinedAt); err != nil {
			return nil, err
		}
		mr.User = u.ToResponse()
		mr.Status = model.StatusOffline
		members = append(members, mr)
	}
	return members, rows.Err()
}

func (r *GuildRepository) GetByInviteCode(code string) (*model.Guild, error) {
	g := &model.Guild{}
	query := `SELECT id, name, icon_url, owner_id, invite_code, created_at FROM guilds WHERE invite_code = $1`
	err := r.db.QueryRow(query, code).Scan(&g.ID, &g.Name, &g.IconURL, &g.OwnerID, &g.InviteCode, &g.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, model.ErrInvalidInvite
	}
	return g, err
}

func (r *GuildRepository) UpdateMemberRole(guildID, userID, role string) error {
	query := `UPDATE members SET role = $3 WHERE guild_id = $1 AND user_id = $2`
	_, err := r.db.Exec(query, guildID, userID, role)
	return err
}

func (r *GuildRepository) CreateInvite(invite *model.Invite) error {
	query := `INSERT INTO invites (code, guild_id, creator_id, max_uses, expires_at) VALUES ($1, $2, $3, $4, $5)`
	_, err := r.db.Exec(query, invite.Code, invite.GuildID, invite.CreatorID, invite.MaxUses, invite.ExpiresAt)
	return err
}

func generateInviteCode() string {
	b := make([]byte, 5)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func (r *GuildRepository) IsMember(guildID, userID string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM members WHERE guild_id = $1 AND user_id = $2)`
	err := r.db.QueryRow(query, guildID, userID).Scan(&exists)
	return exists, err
}

func (r *GuildRepository) CountMembers(guildID string) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM members WHERE guild_id = $1`
	err := r.db.QueryRow(query, guildID).Scan(&count)
	return count, err
}
