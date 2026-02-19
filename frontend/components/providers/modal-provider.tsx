"use client";

import { CreateServerModal } from "@/components/modals/create-server-modal";
import { JoinServerModal } from "@/components/modals/join-server-modal";
import { InviteModal } from "@/components/modals/invite-modal";
import { CreateChannelModal } from "@/components/modals/create-channel-modal";
import { DeleteServerModal } from "@/components/modals/delete-server-modal";
import { LeaveServerModal } from "@/components/modals/leave-server-modal";
import { UserSettingsModal } from "@/components/modals/user-settings-modal";

export function ModalProvider() {
  return (
    <>
      <CreateServerModal />
      <JoinServerModal />
      <InviteModal />
      <CreateChannelModal />
      <DeleteServerModal />
      <LeaveServerModal />
      <UserSettingsModal />
    </>
  );
}
