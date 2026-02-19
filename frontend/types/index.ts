export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Guild {
  id: string;
  name: string;
  icon_url: string | null;
  owner_id: string;
  invite_code: string;
  created_at: string;
}

export interface Channel {
  id: string;
  guild_id: string;
  name: string;
  type: "TEXT" | "VOICE" | "VIDEO";
  category: string | null;
  position: number;
  created_at: string;
}

export interface Message {
  id: string;
  channel_id: string;
  content: string;
  attachment_url: string | null;
  created_at: string;
  updated_at: string | null;
  user: User;
  reactions: Reaction[];
}

export interface Reaction {
  emoji: string;
  count: number;
  me: boolean;
}

export interface Member {
  user: User;
  role: "OWNER" | "ADMIN" | "MODERATOR" | "MEMBER";
  joined_at: string;
  status: string;
}

export interface Conversation {
  id: string;
  is_group: boolean;
  name: string | null;
  members: User[];
  created_at: string;
}

export interface DirectMessage {
  id: string;
  conversation_id: string;
  content: string;
  attachment_url: string | null;
  user: User;
  created_at: string;
}

export interface LFGPost {
  id: string;
  guild_id: string;
  user_id: string;
  game_name: string;
  description: string | null;
  slots_total: number;
  slots_filled: number;
  expires_at: string;
  created_at: string;
  creator: User;
  participants: User[];
}

export interface SoundboardClip {
  id: string;
  guild_id: string;
  name: string;
  file_url: string;
  uploaded_by: string;
  created_at: string;
}

export interface UserPresence {
  user_id: string;
  status: "ONLINE" | "IDLE" | "DND" | "OFFLINE";
  game_name: string | null;
  game_started_at: string | null;
  custom_status: string | null;
}

export interface WSEvent {
  t: string;
  d: unknown;
}

export interface TokenResponse {
  access_token: string;
  user: User;
}
