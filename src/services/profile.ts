import { createClient } from "@supabase/supabase-js";

// --- CLIENTES INDEPENDENTES (Para uso no Server-Side sem Cookies) ---
// Usamos createClient padrão aqui pois estamos buscando dados PÚBLICOS.
// Não usamos o createBrowserClient para evitar problemas de hidratação no servidor.

const hubClient = createClient(
  process.env.NEXT_PUBLIC_HUB_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_HUB_ANON_KEY!
);

const storiesClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- TIPAGEM UNIFICADA ---
export interface UserProfile {
  // Dados do Hub (Identidade)
  facillit_id: string;
  username: string; // Mapeado de 'nickname'
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null; // Mapeado de 'cover_image_url'
  user_category: string | null;
  created_at: string;
  
  // Dados do Stories (Social)
  stats: {
    followers: number;
    following: number;
    posts: number;
    books_read: number;
  };
}

/**
 * Busca o perfil completo (Identidade Hub + Dados Stories)
 */
export async function getProfileByUsername(username: string): Promise<UserProfile | null> {
  try {
    // 1. Busca Identidade no HUB
    // A tabela no Hub usa 'nickname' como nome de usuário
    const { data: hubData, error: hubError } = await hubClient
      .from("profiles")
      .select("facillit_id, nickname, full_name, bio, avatar_url, cover_image_url, user_category, created_at")
      .eq("nickname", username)
      .single();

    if (hubError || !hubData) {
      console.error("Perfil não encontrado no Hub:", hubError?.message);
      return null;
    }

    // 2. Busca Dados Sociais no STORIES (Posts, Seguidores) usando o facillit_id
    // Nota: Como ainda não criamos as tabelas reais de 'follows' no stories,
    // vamos retornar 0 ou buscar de uma tabela futura. 
    // Por enquanto, faremos uma consulta "segura" que retorna 0 se falhar.
    
    let socialStats = {
      followers: 0,
      following: 0,
      posts: 0,
      books_read: 0
    };

    try {
        // Exemplo futuro: const { count } = await storiesClient.from('followers').select('*', { count: 'exact' }).eq('target_id', hubData.facillit_id);
        // socialStats.followers = count || 0;
    } catch (e) {
        // Silently fail for stats (não quebra a página se o banco stories estiver vazio)
    }

    // 3. Retorna Objeto Unificado
    return {
      facillit_id: hubData.facillit_id,
      username: hubData.nickname,
      full_name: hubData.full_name,
      bio: hubData.bio,
      avatar_url: hubData.avatar_url,
      cover_url: hubData.cover_image_url,
      user_category: hubData.user_category,
      created_at: hubData.created_at,
      stats: socialStats
    };

  } catch (error) {
    console.error("Erro fatal ao buscar perfil:", error);
    return null;
  }
}