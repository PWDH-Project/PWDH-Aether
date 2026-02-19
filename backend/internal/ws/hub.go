package ws

import (
	"context"
	"encoding/json"
	"log"
	"sync"

	"github.com/redis/go-redis/v9"
)

const (
	EventMessageCreate = "MESSAGE_CREATE"
	EventMessageUpdate = "MESSAGE_UPDATE"
	EventMessageDelete = "MESSAGE_DELETE"
	EventTypingStart   = "TYPING_START"
	EventChannelCreate = "CHANNEL_CREATE"
	EventChannelUpdate = "CHANNEL_UPDATE"
	EventChannelDelete = "CHANNEL_DELETE"
	EventMemberJoin    = "MEMBER_JOIN"
	EventMemberLeave   = "MEMBER_LEAVE"
	EventPresenceUpdate = "PRESENCE_UPDATE"
	EventVoiceStateUpdate = "VOICE_STATE_UPDATE"
	EventLFGCreate     = "LFG_CREATE"
	EventLFGUpdate     = "LFG_UPDATE"
	EventLFGDelete     = "LFG_DELETE"
)

type Event struct {
	Type   string      `json:"t"`
	Data   interface{} `json:"d"`
	RoomID string      `json:"-"`
}

type Hub struct {
	clients    map[*Client]bool
	rooms      map[string]map[*Client]bool
	register   chan *Client
	unregister chan *Client
	broadcast  chan Event
	rdb        *redis.Client
	mu         sync.RWMutex
}

func NewHub(rdb *redis.Client) *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		rooms:      make(map[string]map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan Event, 256),
		rdb:        rdb,
	}
}

func (h *Hub) Run() {
	go h.subscribeRedis()

	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				for roomID, members := range h.rooms {
					delete(members, client)
					if len(members) == 0 {
						delete(h.rooms, roomID)
					}
				}
			}
			h.mu.Unlock()

		case event := <-h.broadcast:
			h.mu.RLock()
			if members, ok := h.rooms[event.RoomID]; ok {
				data, err := json.Marshal(event)
				if err == nil {
					for client := range members {
						select {
						case client.send <- data:
						default:
							close(client.send)
							delete(members, client)
						}
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *Hub) Subscribe(client *Client, roomID string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.rooms[roomID] == nil {
		h.rooms[roomID] = make(map[*Client]bool)
	}
	h.rooms[roomID][client] = true
}

func (h *Hub) Unsubscribe(client *Client, roomID string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if members, ok := h.rooms[roomID]; ok {
		delete(members, client)
		if len(members) == 0 {
			delete(h.rooms, roomID)
		}
	}
}

func (h *Hub) BroadcastToRoom(roomID string, event Event) {
	event.RoomID = roomID

	if h.rdb != nil {
		data, err := json.Marshal(event)
		if err == nil {
			h.rdb.Publish(context.Background(), "ws:"+roomID, data)
		}
	} else {
		h.broadcast <- event
	}
}

func (h *Hub) subscribeRedis() {
	if h.rdb == nil {
		return
	}
	ctx := context.Background()
	pubsub := h.rdb.PSubscribe(ctx, "ws:*")
	defer pubsub.Close()

	ch := pubsub.Channel()
	for msg := range ch {
		var event Event
		if err := json.Unmarshal([]byte(msg.Payload), &event); err != nil {
			log.Printf("redis unmarshal: %v", err)
			continue
		}
		roomID := msg.Channel[3:]
		event.RoomID = roomID

		h.mu.RLock()
		if members, ok := h.rooms[roomID]; ok {
			data := []byte(msg.Payload)
			for client := range members {
				select {
				case client.send <- data:
				default:
				}
			}
		}
		h.mu.RUnlock()
	}
}

func (h *Hub) BroadcastToGuild(guildID string, event Event) {
	roomID := "guild:" + guildID
	event.RoomID = roomID

	if h.rdb != nil {
		data, err := json.Marshal(event)
		if err == nil {
			h.rdb.Publish(context.Background(), "ws:"+roomID, data)
		}
	} else {
		h.broadcast <- event
	}
}
