import { create } from "zustand";
import { api } from "@/lib/api";
import type { User, TokenResponse } from "@/types";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const res = await api.post<TokenResponse>("/api/auth/login", { email, password });
    api.setToken(res.access_token);
    set({ user: res.user, isAuthenticated: true, isLoading: false });
  },

  register: async (username, email, password) => {
    const res = await api.post<TokenResponse>("/api/auth/register", { username, email, password });
    api.setToken(res.access_token);
    set({ user: res.user, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    api.setToken(null);
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  loadUser: async () => {
    try {
      if (!api.getToken()) {
        set({ isLoading: false });
        return;
      }
      const user = await api.get<User>("/api/users/@me");
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      api.setToken(null);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
