"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

async function getClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );
}

export async function toggleFollow(targetUserId: string, currentUserId: string) {
  const supabase = await getClient();
  
  // Verifica se já segue
  const { data: existing } = await supabase
    .from("follows")
    .select()
    .eq("follower_id", currentUserId)
    .eq("following_id", targetUserId)
    .maybeSingle();

  if (existing) {
    await supabase.from("follows").delete().eq("follower_id", currentUserId).eq("following_id", targetUserId);
  } else {
    await supabase.from("follows").insert({ follower_id: currentUserId, following_id: targetUserId });
  }

  revalidatePath(`/u/${targetUserId}`);
}