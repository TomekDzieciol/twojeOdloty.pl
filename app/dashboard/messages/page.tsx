import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MessageThread } from "@/components/MessageThread";
import type { Message } from "@/types/database";

interface MessagesPageProps {
  searchParams: { with?: string };
}

function otherUserId(msg: Message, me: string): string {
  return msg.sender_id === me ? msg.recipient_id : msg.sender_id;
}

export default async function DashboardMessagesPage({ searchParams }: MessagesPageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const withId = typeof searchParams.with === "string" ? searchParams.with.trim() : null;

  if (withId) {
    const [outgoing, incoming, otherProfileRes] = await Promise.all([
      supabase
        .from("messages")
        .select("id, sender_id, recipient_id, body, read_at, created_at")
        .eq("sender_id", user.id)
        .eq("recipient_id", withId)
        .order("created_at", { ascending: true }),
      supabase
        .from("messages")
        .select("id, sender_id, recipient_id, body, read_at, created_at")
        .eq("sender_id", withId)
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: true }),
      supabase.from("profiles").select("display_name").eq("id", withId).single(),
    ]);
    const messages = [
      ...(outgoing.data ?? []),
      ...(incoming.data ?? []),
    ].sort(
      (a, b) =>
        new Date((a as Message).created_at).getTime() -
        new Date((b as Message).created_at).getTime()
    ) as Message[];
    const otherProfile = otherProfileRes.data;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/messages" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
            ← Wszystkie wiadomości
          </Link>
        </div>
        <h1 className="text-2xl font-bold">
          Rozmowa z {otherProfile?.display_name ?? "użytkownikiem"}
        </h1>
        <MessageThread
          messages={messages}
          currentUserId={user.id}
          otherUserId={withId}
          otherDisplayName={otherProfile?.display_name ?? null}
        />
      </div>
    );
  }

  const { data: messagesData } = await supabase
    .from("messages")
    .select("id, sender_id, recipient_id, body, read_at, created_at")
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const messages = (messagesData ?? []) as Message[];
  const byOther: Record<
    string,
    { last: Message; unread: number }
  > = {};
  for (const msg of messages) {
    const other = otherUserId(msg, user.id);
    if (!byOther[other]) {
      byOther[other] = { last: msg, unread: 0 };
    }
    if (msg.recipient_id === user.id && !msg.read_at) {
      byOther[other].unread += 1;
    }
  }

  const otherIds = Object.keys(byOther);
  const profilesRes =
    otherIds.length > 0
      ? await supabase.from("profiles").select("id, display_name").in("id", otherIds)
      : { data: [] as { id: string; display_name: string | null }[] };
  const profilesMap = new Map(
    (profilesRes.data ?? []).map((p) => [p.id, p.display_name ?? "Użytkownik"])
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Wiadomości</h1>
      {otherIds.length === 0 ? (
        <p className="text-[var(--muted)]">Brak wiadomości.</p>
      ) : (
        <ul className="divide-y divide-[#2a2a32]">
          {otherIds.map((otherId) => {
            const { last, unread } = byOther[otherId];
            const displayName = profilesMap.get(otherId) ?? "Użytkownik";
            const preview = last.body.length > 80 ? last.body.slice(0, 80) + "…" : last.body;
            return (
              <li key={otherId}>
                <Link
                  href={`/dashboard/messages?with=${encodeURIComponent(otherId)}`}
                  className="block py-4 hover:bg-[#25252d]/50 rounded-lg px-2 -mx-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{displayName}</span>
                    {unread > 0 && (
                      <span className="text-xs bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full">
                        {unread}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--muted)] mt-0.5 truncate">{preview}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
