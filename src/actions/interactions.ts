"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function toggleLike(postId: string, currentUserId: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  const { data: existingLike } = await supabase
    .from("likes")
    .select("*")
    .eq("user_id", currentUserId)
    .eq("post_id", postId)
    .single();

  if (existingLike) {
    await supabase.from("likes").delete().eq("user_id", currentUserId).eq("post_id", postId);
  } else {
    await supabase.from("likes").insert({ user_id: currentUserId, post_id: postId });
  }

  revalidatePath("/");
}

export async function toggleCommentLike(commentId: string, currentUserId: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  const { data: existingLike } = await supabase
    .from("comment_likes")
    .select("*")
    .eq("user_id", currentUserId)
    .eq("comment_id", commentId)
    .single();

  if (existingLike) {
    await supabase.from("comment_likes").delete().eq("user_id", currentUserId).eq("comment_id", commentId);
  } else {
    await supabase.from("comment_likes").insert({ user_id: currentUserId, comment_id: commentId });
  }
}