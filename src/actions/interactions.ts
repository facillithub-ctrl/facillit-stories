"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// --- LIKES ---

export async function toggleLike(postId: string, currentUserId: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  // 1. Verifica se já deu like
  const { data: existingLike } = await supabase
    .from("likes")
    .select("*")
    .eq("user_id", currentUserId)
    .eq("post_id", postId)
    .single();

  if (existingLike) {
    // Remove Like
    await supabase.from("likes").delete().eq("user_id", currentUserId).eq("post_id", postId);
  } else {
    // Adiciona Like
    await supabase.from("likes").insert({ user_id: currentUserId, post_id: postId });
  }

  revalidatePath("/"); // Atualiza a home
  revalidatePath(`/post/${postId}`); // Atualiza o post (se existisse página individual)
}

// --- COMENTÁRIOS ---

export async function addComment(postId: string, content: string, currentUserId: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  if (!content.trim()) return;

  await supabase.from("comments").insert({
    user_id: currentUserId,
    post_id: postId,
    content: content
  });

  revalidatePath("/");
}