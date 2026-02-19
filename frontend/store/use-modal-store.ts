import { create } from "zustand";
import type { Guild, Channel } from "@/types";

export type ModalType =
  | "createServer"
  | "joinServer"
  | "inviteModal"
  | "serverSettings"
  | "createChannel"
  | "deleteChannel"
  | "deleteServer"
  | "leaveServer"
  | "userSettings";

interface ModalData {
  server?: Guild;
  channel?: Channel;
}

interface ModalState {
  type: ModalType | null;
  data: ModalData;
  isOpen: boolean;

  open: (type: ModalType, data?: ModalData) => void;
  close: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  type: null,
  data: {},
  isOpen: false,

  open: (type, data = {}) => set({ type, data, isOpen: true }),
  close: () => set({ type: null, data: {}, isOpen: false }),
}));
