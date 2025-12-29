import { createClient } from "@supabase/supabase-js";

// 1. Cliente HUB (Identidade)
const hubClient = createClient(
  process.env.NEXT_PUBLIC_HUB_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_HUB_ANON_KEY!
);

export interface UserProfile {
  user_id: string;
  facillit_id: string;
  username: string; 
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null; 
  user_category: string | null;
  verification_badge: string | null;
  created_at: string;
  stats: {
    followers: number;
    following: number;
    posts: number;
    books_read: number;
  };
}

export async function getProfileByUsername(username: string): Promise<UserProfile | null> {
  console.log(`[PROFILE_SERVICE] 🔍 Buscando perfil para: ${username}`);
  
  try {
    const { data: hubData, error: hubError } = await hubClient
      .from("profiles")
      .select("*") // Pega tudo para garantir que não estamos esquecendo colunas
      .eq("nickname", username)
      .single();

    if (hubError) {
      console.error(`[PROFILE_SERVICE] ❌ Erro ao buscar no HUB:`, hubError.message);
      return null;
    }

    if (!hubData) {
      console.warn(`[PROFILE_SERVICE] ⚠️ Perfil não encontrado para: ${username}`);
      return null;
    }

    // LOG CRÍTICO: Verifique se 'user_id' aparece neste objeto no terminal
    console.log(`[PROFILE_SERVICE] ✅ Dados brutos retornados:`, { 
        nickname: hubData.nickname, 
        user_id: hubData.user_id, // <-- Este é o campo vital
        facillit_id: hubData.facillit_id 
    });

    if (!hubData.user_id) {
        console.error(`[PROFILE_SERVICE] 🚨 PERIGO: O campo 'user_id' está vindo NULO ou UNDEFINED do banco.`);
    }

    return {
      user_id: hubData.user_id,
      facillit_id: hubData.facillit_id,
      username: hubData.nickname,
      full_name: hubData.full_name,
      bio: hubData.bio,
      avatar_url: hubData.avatar_url,
      cover_url: hubData.cover_image_url || hubData.cover_url,
      user_category: hubData.user_category,
      verification_badge: hubData.verification_badge || hubData.badge,
      created_at: hubData.created_at,
      stats: { followers: 0, following: 0, posts: 0, books_read: 0 }
    };

  } catch (error) {
    console.error("[PROFILE_SERVICE] 💥 Erro fatal (Exception):", error);
    return null;
  }
}