"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { sendPushNotification } from "@/lib/firebase-admin";
import { SupabaseClient } from "@supabase/supabase-js";

// --- HELPERS ---

// Cria os clientes para validação cruzada
async function getClients() {
  const cookieStore = await cookies();

  // 1. Cliente HUB (Para verificar quem é o usuário)
  const hubSupabase = createServerClient(
    process.env.NEXT_PUBLIC_HUB_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_HUB_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  // 2. Cliente STORIES (Para escrever os dados)
  // Usamos sem cookies para evitar conflito, já que o banco agora aceita escrita via RLS aberta
  const storiesSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return undefined; } } }
  );

  return { hubSupabase, storiesSupabase };
}

async function createNotification(
  supabase: SupabaseClient,
  recipientId: string,
  actorId: string,
  resourceId: string,
  resourceType: 'post' | 'comment',
  type: 'like_post' | 'like_comment' | 'reply_comment' | 'mention'
) {
  if (recipientId === actorId) return;

  const { error } = await supabase.from("notifications").insert({
    recipient_id: recipientId,
    actor_id: actorId,
    resource_id: resourceId,
    resource_type: resourceType,
    type: type,
    read: false
  });

  if (error) console.error("[Notification] DB Error:", error.message);

  const messages: Record<string, string> = {
    'like_post': 'curtiu sua publicação.',
    'like_comment': 'curtiu seu comentário.',
    'reply_comment': 'respondeu seu comentário.',
    'mention': 'mencionou você.'
  };
  
  sendPushNotification(recipientId, "Nova Interação", messages[type] || "Interagiu com você")
    .catch(err => console.error("[Notification] Push Error:", err));
}

// --- LIKES POST ---
export async function toggleLike(postId: string, currentUserId: string, postOwnerId: string): Promise<void> {
  const { hubSupabase, storiesSupabase } = await getClients();

  // 1. SEGURANÇA: Validar se o usuário é quem diz ser
  const { data: { user } } = await hubSupabase.auth.getUser();
  if (!user || user.id !== currentUserId) {
    throw new Error("Sessão inválida ou expirada.");
  }

  // 2. LÓGICA NO STORIES
  const { data: existingLike, error: fetchError } = await storiesSupabase
    .from("likes")
    .select("user_id")
    .eq("user_id", currentUserId)
    .eq("post_id", postId)
    .maybeSingle();

  if (fetchError) {
    console.error("Erro ao buscar like:", fetchError.message);
    return;
  }

  if (existingLike) {
    const { error } = await storiesSupabase.from("likes").delete().eq("user_id", currentUserId).eq("post_id", postId);
    if (error) throw new Error("Falha ao remover like: " + error.message);
  } else {
    const { error } = await storiesSupabase.from("likes").insert({ user_id: currentUserId, post_id: postId });
    if (error) throw new Error("Falha ao salvar like: " + error.message);
    
    // Notificar
    await createNotification(storiesSupabase, postOwnerId, currentUserId, postId, 'post', 'like_post');
  }

  revalidatePath("/");
}

// --- LIKES COMENTÁRIO ---
export async function toggleCommentLike(commentId: string, currentUserId: string, commentOwnerId: string): Promise<void> {
  const { hubSupabase, storiesSupabase } = await getClients();

  // Validação de Segurança
  const { data: { user } } = await hubSupabase.auth.getUser();
  if (!user || user.id !== currentUserId) throw new Error("Acesso negado.");

  const { data: existingLike } = await storiesSupabase
    .from("comment_likes")
    .select("user_id")
    .eq("user_id", currentUserId)
    .eq("comment_id", commentId)
    .maybeSingle();

  if (existingLike) {
    await storiesSupabase.from("comment_likes").delete().eq("user_id", currentUserId).eq("comment_id", commentId);
  } else {
    await storiesSupabase.from("comment_likes").insert({ user_id: currentUserId, comment_id: commentId });
    await createNotification(storiesSupabase, commentOwnerId, currentUserId, commentId, 'comment', 'like_comment');
  }
}

// --- ADICIONAR COMENTÁRIO ---
export async function addComment(
  postId: string, 
  content: string, 
  currentUserId: string, 
  parentId: string | null = null,
  postOwnerId: string
): Promise<{ success?: boolean; error?: string }> {
  const { hubSupabase, storiesSupabase } = await getClients();

  // Validação de Segurança
  const { data: { user } } = await hubSupabase.auth.getUser();
  if (!user || user.id !== currentUserId) return { error: "Usuário não autenticado." };

  if (!content.trim()) return { error: "Conteúdo vazio" };

  const { error } = await storiesSupabase.from("comments").insert({
    user_id: currentUserId,
    post_id: postId,
    content: content,
    parent_id: parentId
  });

  if (error) {
    console.error("Erro ao comentar:", error.message);
    return { error: error.message };
  }

  // Notificações
  if (parentId) {
    const { data: parent } = await storiesSupabase.from("comments").select("user_id").eq("id", parentId).single();
    if (parent) await createNotification(storiesSupabase, parent.user_id, currentUserId, postId, 'post', 'reply_comment');
  } else {
    await createNotification(storiesSupabase, postOwnerId, currentUserId, postId, 'post', 'reply_comment');
  }

  // Menções
  const mentions = content.match(/@(\w+)/g);
  if (mentions) {
      const uniqueMentions = Array.from(new Set(mentions));
      for (const mention of uniqueMentions) {
          const nickname = mention.substring(1);
          const { data: mentionedUser } = await storiesSupabase
            .from("profiles")
            .select("user_id")
            .eq("nickname", nickname)
            .maybeSingle();
            
          if (mentionedUser) {
              await createNotification(storiesSupabase, mentionedUser.user_id, currentUserId, postId, 'post', 'mention');
          }
      }
  }

  revalidatePath("/");
  return { success: true };
}