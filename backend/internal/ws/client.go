package ws

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gofiber/contrib/websocket"
)

const (
	writeWait      = 10 * time.Second
	pongWait       = 60 * time.Second
	pingPeriod     = (pongWait * 9) / 10
	maxMessageSize = 4096
)

type Client struct {
	hub    *Hub
	conn   *websocket.Conn
	send   chan []byte
	UserID string
	rooms  map[string]bool
}

type ClientMessage struct {
	Op   string          `json:"op"`
	Data json.RawMessage `json:"d"`
}

type SubscribeData struct {
	ChannelID string `json:"channel_id"`
}

type TypingData struct {
	ChannelID string `json:"channel_id"`
}

func NewClient(hub *Hub, conn *websocket.Conn, userID string) *Client {
	return &Client{
		hub:    hub,
		conn:   conn,
		send:   make(chan []byte, 256),
		UserID: userID,
		rooms:  make(map[string]bool),
	}
}

func (c *Client) ReadPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)

	for {
		_, rawMsg, err := c.conn.ReadMessage()
		if err != nil {
			break
		}

		var msg ClientMessage
		if err := json.Unmarshal(rawMsg, &msg); err != nil {
			continue
		}

		switch msg.Op {
		case "SUBSCRIBE":
			var data SubscribeData
			if err := json.Unmarshal(msg.Data, &data); err == nil && data.ChannelID != "" {
				c.hub.Subscribe(c, data.ChannelID)
				c.rooms[data.ChannelID] = true
			}

		case "UNSUBSCRIBE":
			var data SubscribeData
			if err := json.Unmarshal(msg.Data, &data); err == nil && data.ChannelID != "" {
				c.hub.Unsubscribe(c, data.ChannelID)
				delete(c.rooms, data.ChannelID)
			}

		case "TYPING":
			var data TypingData
			if err := json.Unmarshal(msg.Data, &data); err == nil && data.ChannelID != "" {
				c.hub.BroadcastToRoom(data.ChannelID, Event{
					Type: EventTypingStart,
					Data: map[string]string{
						"user_id":    c.UserID,
						"channel_id": data.ChannelID,
					},
					RoomID: data.ChannelID,
				})
			}

		case "SUBSCRIBE_GUILD":
			var data struct {
				GuildID string `json:"guild_id"`
			}
			if err := json.Unmarshal(msg.Data, &data); err == nil && data.GuildID != "" {
				roomID := "guild:" + data.GuildID
				c.hub.Subscribe(c, roomID)
				c.rooms[roomID] = true
			}
		}
	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func ServeWs(hub *Hub, conn *websocket.Conn, userID string) {
	client := NewClient(hub, conn, userID)
	hub.register <- client

	log.Printf("WebSocket connected: user=%s", userID)

	go client.WritePump()
	client.ReadPump()
}
