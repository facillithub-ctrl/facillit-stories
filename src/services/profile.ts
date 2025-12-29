import { createClient } from "@supabase/supabase-js";

// --- CLIENTES INDEPENDENTES (Data Fetching Server-Side) ---
// Usamos 'createClient' padrão do SDK JS pois esta função busca dados PÚBLICOS
// usando a ANON_KEY. Não precisamos de contexto de sessão (cookies) aqui.

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
  // Dados vindos do HUB
  facillit_id: string;
  username: string; // Mapeado de 'nickname'
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null; // Mapeado de 'cover_image_url'
  user_category: string | null;
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
 * @param username O nickname do usuário (ex: 'joao.silva')
 */
export async function getProfileByUsername(username: string): Promise<UserProfile | null> {
  try {
    // ---------------------------------------------------------
    // ETAPA 1: Buscar Identidade no HUB
    // ---------------------------------------------------------
    // A tabela 'profiles' no Hub usa 'nickname' como identificador único legível.
    const { data: hubData, error: hubError } = await hubClient
      .from("profiles")
      .select("facillit_id, nickname, full_name, bio, avatar_url, cover_image_url, user_category, created_at")
      .eq("nickname", username)
      .single();

    if (hubError || !hubData) {
      console.warn(`Perfil '${username}' não encontrado no Hub:`, hubError?.message);
      return null;
    }

    // ---------------------------------------------------------
    // ETAPA 2: Buscar Dados Sociais no STORIES
    // ---------------------------------------------------------
    // Usamos o 'facillit_id' obtido no passo anterior para buscar as conexões.
    // Envolvemos em try/catch para garantir que a página carregue mesmo se
    // as tabelas de 'follows' ou 'posts' ainda não existirem no Stories.
    
    const socialStats = {
      followers: 0,
      following: 0,
      posts: 0,
      books_read: 0
    };

    try {
        // --- Exemplo de implementação futura ---
        // const { count: followersCount } = await storiesClient
        //   .from('follows')
        //   .select('*', { count: 'exact', head: true })
        //   .eq('following_id', hubData.facillit_id);
        
        // if (followersCount !== null) socialStats.followers = followersCount;

        // Por enquanto, retornamos zero para não quebrar o layout
    } catch (socialError) {
        console.error("Erro não-crítico ao buscar stats sociais:", socialError);
        // Não fazemos 'throw' aqui para permitir que o perfil carregue só com dados do Hub
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
      cover_url: hubData.cover_image_url, // Normalizando nome do campo
      user_category: hubData.user_category,
      created_at: hubData.created_at,
      stats: socialStats
    };

  } catch (error) {
    console.error("Erro fatal no serviço getProfileByUsername:", error);
    return null;
  }
}