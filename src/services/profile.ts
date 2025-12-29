import { createClient } from "@supabase/supabase-js";

// --- CLIENTES INDEPENDENTES ---

// 1. Cliente HUB (Fonte da Identidade)
const hubClient = createClient(
  process.env.NEXT_PUBLIC_HUB_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_HUB_ANON_KEY!
);

// 2. Cliente STORIES (Fonte dos Dados Sociais)
const storiesClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- TIPAGEM UNIFICADA ---
export interface UserProfile {
  user_id: string; // <--- CORREÇÃO: Adicionado
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
  try {
    // ---------------------------------------------------------
    // ETAPA 1: Buscar Identidade no HUB
    // ---------------------------------------------------------
    const { data: hubData, error: hubError } = await hubClient
      .from("profiles")
      .select("*") // Seleciona tudo para garantir que user_id venha
      .eq("nickname", username)
      .single();

    if (hubError || !hubData) {
      return null;
    }

    // ---------------------------------------------------------
    // ETAPA 2: Buscar Dados Sociais no STORIES (Mock por enquanto)
    // ---------------------------------------------------------
    const socialStats = {
      followers: 0,
      following: 0,
      posts: 0,
      books_read: 0
    };

    // ---------------------------------------------------------
    // ETAPA 3: Retornar Objeto Unificado
    // ---------------------------------------------------------
    return {
      user_id: hubData.user_id, // <--- CORREÇÃO: Repassando o ID real
      facillit_id: hubData.facillit_id,
      username: hubData.nickname,
      full_name: hubData.full_name,
      bio: hubData.bio,
      avatar_url: hubData.avatar_url,
      cover_url: hubData.cover_image_url || hubData.cover_url,
      user_category: hubData.user_category,
      verification_badge: hubData.verification_badge || hubData.badge,
      created_at: hubData.created_at,
      stats: socialStats
    };

  } catch (error) {
    console.error("Erro fatal no serviço getProfileByUsername:", error);
    return null;
  }
}