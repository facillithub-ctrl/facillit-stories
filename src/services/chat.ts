import { createBrowserClient } from "@supabase/ssr";

const STORIES_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const STORIES_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const HUB_URL = process.env.NEXT_PUBLIC_HUB_SUPABASE_URL!;
const HUB_KEY = process.env.NEXT_PUBLIC_HUB_ANON_KEY!;

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  read_at: string | null;
}

export interface ChatUser {
  id: string;
  nickname: string;
  full_name: string | null;
  avatar_url: string | null;
  verification_badge: string | null;
}

export interface InboxItem {
  contact: ChatUser;
  lastMessage: Message;
  unreadCount: number;
}

// Clientes separados
const getStoriesClient = () => createBrowserClient(STORIES_URL, STORIES_KEY);
const getHubClient = () => createBrowserClient(HUB_URL, HUB_KEY);

export async function fetchInbox() {
  const storiesSupabase = getStoriesClient();
  const hubSupabase = getHubClient();

  const { data: { user } } = await hubSupabase.auth.getUser();
  if (!user) return [];

  // 1. Busca conversas
  const { data: conversations, error } = await storiesSupabase
    .from("inbox_view")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !conversations) return [];

  // 2. Extrai IDs únicos
  const contactIds = Array.from(new Set(conversations.map(c => c.conversation_partner)));
  if (contactIds.length === 0) return [];

  // 3. Busca perfis no HUB
  const { data: profiles } = await hubSupabase
    .from("profiles")
    .select("user_id, nickname, full_name, avatar_url, verification_badge")
    .in("user_id", contactIds);

  if (!profiles) return [];

  // 4. Monta InboxItem
  return conversations.map(conv => {
    const profile = profiles.find(p => p.user_id === conv.conversation_partner);
    // Se não achou perfil (ex: deletado), retorna null para filtrar depois
    if (!profile) return null;

    return {
      contact: {
        id: conv.conversation_partner,
        nickname: profile.nickname || "Usuário",
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        verification_badge: profile.verification_badge
      },
      lastMessage: {
        id: conv.message_id,
        content: conv.content,
        sender_id: conv.sender_id,
        receiver_id: conv.owner_id === conv.sender_id ? conv.conversation_partner : conv.owner_id,
        created_at: conv.created_at,
        read_at: conv.read_at
      },
      unreadCount: (conv.sender_id !== user.id && !conv.read_at) ? 1 : 0
    };
  }).filter(Boolean) as InboxItem[];
}

export async function fetchMessages(otherUserId: string) {
  const storiesSupabase = getStoriesClient();
  const hubSupabase = getHubClient();
  const { data: { user } } = await hubSupabase.auth.getUser();
  if (!user) return [];

  const { data } = await storiesSupabase
    .from("messages")
    .select("*")
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
    .order("created_at", { ascending: true });

  return (data as Message[]) || [];
}

export async function markAsRead(otherUserId: string) {
  const storiesSupabase = getStoriesClient();
  const hubSupabase = getHubClient();
  const { data: { user } } = await hubSupabase.auth.getUser();
  if (!user) return;

  await storiesSupabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("sender_id", otherUserId)
    .eq("receiver_id", user.id)
    .is("read_at", null);
}