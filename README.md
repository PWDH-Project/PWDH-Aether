# PWDH-Aether

Die ultimative Gaming-Kommunikationsplattform -- eine performante Discord-Alternative, von Grund auf fuer Gamer gebaut.

## Features

- **Echtzeit-Chat** mit WebSocket, Markdown, Dateianhange, Reaktionen, Typing-Indicator
- **Server & Kanaele** mit Rollen (Owner, Admin, Moderator, Member) und Einladungscodes
- **Voice & Video** mit LiveKit (Mute, Deafen, Screenshare, Sprecher-Erkennung)
- **LFG-System** (Looking for Group) -- integriertes Board pro Server
- **Soundboard** -- eigene Sounds hochladen und im Voice-Chat abspielen
- **Game Activity** -- zeige an, was du gerade spielst
- **Custom Themes** -- waehlbare Neon-Akzentfarben (Cyan, Gruen, Magenta, etc.)
- **Streamer Mode** -- versteckt persoenliche Infos mit einem Klick
- **Direktnachrichten** -- 1:1 und Gruppen-DMs
- **Command Palette** -- Ctrl+K fuer schnelle Navigation

## Tech Stack

| Bereich | Technologie |
|---------|-------------|
| Frontend | Next.js 15, React 19, TailwindCSS 4, Zustand, shadcn/ui, Framer Motion |
| Backend | Go (Golang), Fiber v2, gorilla/websocket |
| Datenbank | PostgreSQL 16 |
| Echtzeit | Go WebSocket Hub + Redis PubSub |
| Media | LiveKit (SFU) |
| Caching | Redis 7 |
| Storage | MinIO (S3-kompatibel) |
| Container | Docker Compose |

## Voraussetzungen

- Docker & Docker Compose
- Go 1.23+
- Node.js 20+
- npm

## Setup

### 1. Repository klonen

```bash
git clone <repo-url>
cd PWDH-Aether
```

### 2. Infrastruktur starten

```bash
docker compose up -d
```

Dies startet PostgreSQL, Redis, MinIO und LiveKit.

### 3. Backend starten

```bash
cd backend
cp ../.env .env
go mod tidy
go run ./cmd/server/main.go
```

Das Backend laeuft auf `http://localhost:8080`.

### 4. Frontend starten

```bash
cd frontend
npm install
npm run dev
```

Das Frontend laeuft auf `http://localhost:3000`.

### 5. Loslegen

1. Oeffne `http://localhost:3000`
2. Erstelle einen Account
3. Erstelle einen Server
4. Lade Freunde via Einladungscode ein
5. Chatte, spiele, nutze das Soundboard!

## Projektstruktur

```
PWDH-Aether/
├── frontend/              # Next.js Frontend
│   ├── app/               # Seiten (App Router)
│   ├── components/        # React-Komponenten
│   ├── store/             # Zustand Stores
│   ├── hooks/             # Custom Hooks
│   ├── lib/               # API-Client, Utilities
│   └── types/             # TypeScript-Typen
├── backend/               # Go Backend
│   ├── cmd/server/        # Einstiegspunkt
│   ├── internal/          # Internes Package
│   │   ├── config/        # Konfiguration
│   │   ├── database/      # DB-Verbindungen
│   │   ├── handler/       # HTTP-Handler
│   │   ├── middleware/     # Auth, CORS, Rate Limiting
│   │   ├── model/         # Datenmodelle
│   │   ├── repository/    # DB-Queries
│   │   ├── service/       # Business-Logik
│   │   └── ws/            # WebSocket Hub
│   └── migrations/        # SQL-Migrationen
├── docker-compose.yml     # Infrastruktur
└── .env.example           # Umgebungsvariablen
```

## API Endpoints

### Auth
- `POST /api/auth/register` -- Registrierung
- `POST /api/auth/login` -- Login

### User
- `GET /api/users/@me` -- Eigenes Profil
- `PATCH /api/users/@me` -- Profil bearbeiten

### Guilds (Server)
- `GET /api/guilds` -- Meine Server
- `POST /api/guilds` -- Server erstellen
- `POST /api/guilds/join` -- Server beitreten
- `GET /api/guilds/:id/channels` -- Kanaele laden
- `GET /api/guilds/:id/members` -- Mitglieder laden

### Channels
- `POST /api/guilds/:id/channels` -- Kanal erstellen
- `GET /api/channels/:id/messages` -- Nachrichten laden
- `POST /api/channels/:id/messages` -- Nachricht senden

### Gaming
- `GET/POST /api/guilds/:id/lfg` -- LFG-Posts
- `GET/POST /api/guilds/:id/soundboard` -- Soundboard
- `GET/PATCH /api/presence` -- Game Activity

### WebSocket
- `GET /ws?token=<jwt>` -- WebSocket-Verbindung

## Keyboard Shortcuts

| Shortcut | Aktion |
|----------|--------|
| Ctrl+K | Command Palette oeffnen |

## Lizenz

MIT
