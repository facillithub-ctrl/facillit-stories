import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  avatar_url: string | null;
}

export interface InboxItem {
  contact: ChatUser;
  lastMessage: Message;
  unreadCount: number;
}

// --- NOVAS FUNÇÕES ---

// Buscar Inbox (Lista de Conversas)
export async function fetchInbox() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // 1. Busca a última mensagem de cada conversa via View
  const { data: conversations, error } = await supabase
    .from("inbox_view")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !conversations) {
    console.error("Erro ao buscar inbox:", error);
    return [];
  }

  // 2. Busca os detalhes dos perfis desses contatos
  const contactIds = conversations.map(c => c.conversation_partner);
  
  if (contactIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, nickname, avatar_url")
    .in("user_id", contactIds);

  // 3. Monta o objeto final combinando dados
  const inboxItems: InboxItem[] = conversations.map(conv => {
    const profile = profiles?.find(p => p.user_id === conv.conversation_partner);
    
    return {
      contact: {
        id: conv.conversation_partner,
        nickname: profile?.nickname || "Usuário Desconhecido",
        avatar_url: profile?.avatar_url || null
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
      // Nota: Para contagem exata de unread, precisaríamos de outra query, 
      // mas para MVP isso indica se a ÚLTIMA é não lida.
    };
  });

  return inboxItems;
}

// --- FUNÇÕES EXISTENTES (Mantidas) ---

export async function sendMessage(content: string, receiverId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  return await supabase.from("messages").insert({
    content,
    sender_id: user.id,
    receiver_id: receiverId
  }).select().single();
}

export async function fetchMessages(otherUserId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("messages")
    .select("*")
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
    .order("created_at", { ascending: true });

  return (data as Message[]) || [];
}

export async function markAsRead(otherUserId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("sender_id", otherUserId)
    .eq("receiver_id", user.id)
    .is("read_at", null);
}