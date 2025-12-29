import { createClient } from "@supabase/supabase-js";

// --- CLIENTES INDEPENDENTES (Data Fetching Server-Side) ---

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
  facillit_id: string;
  username: string; // Mapeado de 'nickname'
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null; // Mapeado de 'cover_image_url'
  user_category: string | null;
  verification_badge: string | null; // Novo campo
  created_at: string;
  
  // Dados vindos do STORIES
  stats: {
    followers: number;
    following: number;
    posts: number;
    books_read: number;
  };
}

/**
 * Busca o perfil completo unificando dados de identidade (Hub) e sociais (Stories).
 */
export async function getProfileByUsername(username: string): Promise<UserProfile | null> {
  try {
    // ---------------------------------------------------------
    // ETAPA 1: Buscar Identidade no HUB
    // ---------------------------------------------------------
    const { data: hubData, error: hubError } = await hubClient
      .from("profiles")
      .select(`
        facillit_id, 
        nickname, 
        full_name, 
        bio, 
        avatar_url, 
        cover_image_url, 
        user_category, 
        verification_badge, 
        badge,
        created_at
      `)
      .eq("nickname", username)
      .single();

    if (hubError || !hubData) {
      // console.warn(`Perfil '${username}' não encontrado no Hub.`);
      return null;
    }

    // ---------------------------------------------------------
    // ETAPA 2: Buscar Dados Sociais no STORIES
    // ---------------------------------------------------------
    const socialStats = {
      followers: 0,
      following: 0,
      posts: 0,
      books_read: 0
    };

    try {
        // Implementação futura para buscar counts reais
        // const { count } = await storiesClient.from('follows').select...
    } catch (socialError) {
        // Falha silenciosa se o banco stories não tiver as tabelas ainda
    }

    // ---------------------------------------------------------
    // ETAPA 3: Retornar Objeto Unificado
    // ---------------------------------------------------------
    return {
      facillit_id: hubData.facillit_id,
      username: hubData.nickname,
      full_name: hubData.full_name,
      bio: hubData.bio,
      avatar_url: hubData.avatar_url,
      cover_url: hubData.cover_image_url,
      user_category: hubData.user_category,
      // Prioriza verification_badge, fallback para badge (legado)
      verification_badge: hubData.verification_badge || hubData.badge,
      created_at: hubData.created_at,
      stats: socialStats
    };

  } catch (error) {
    console.error("Erro fatal no serviço getProfileByUsername:", error);
    return null;
  }
}