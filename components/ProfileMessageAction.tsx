"use client";

import Link from "next/link";
import { SendMessageForm } from "./SendMessageForm";

interface ProfileMessageActionProps {
  profileUserId: string;
  currentUserId: string | null;
}

export function ProfileMessageAction({ profileUserId, currentUserId }: ProfileMessageActionProps) {
  if (!currentUserId) {
    const redirect = `/profile/${profileUserId}?compose=1`;
    return (
      <div className="mt-4">
        <Link
          href={`/login?redirect=${encodeURIComponent(redirect)}`}
          className="btn-primary inline-block text-sm"
        >
          Wyślij wiadomość
        </Link>
      </div>
    );
  }

  if (currentUserId === profileUserId) {
    return (
      <div className="mt-4">
        <Link href="/dashboard/messages" className="btn-primary inline-block text-sm">
          Zobacz wiadomości
        </Link>
      </div>
    );
  }

  return <SendMessageForm recipientId={profileUserId} />;
}
