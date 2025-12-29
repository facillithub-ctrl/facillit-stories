import { SupabaseClient, User } from "@supabase/supabase-js";

export async function syncUserProfile(
  user: User, 
  hubClient: SupabaseClient, 
  storiesClient: SupabaseClient
) {
  if (!user || !user.id) return;

  try {
    // 1. Busca dados COMPLETOS no Hub (Incluindo cover_image_url)
    let { data: hubProfile } = await hubClient
      .from("profiles")
      .select("facillit_id, nickname, full_name, avatar_url, cover_image_url, bio, user_category, verification_badge")
      .eq("user_id", user.id)
      .maybeSingle();

    // Fallback se não encontrar
    if (!hubProfile) {
         // Tenta buscar por ID antigo se necessário
         const { data: retryData } = await hubClient
            .from("profiles")
            .select("facillit_id, nickname, full_name, avatar_url, cover_image_url, bio, user_category, verification_badge")
            .eq("id", user.id)
            .maybeSingle();
         hubProfile = retryData;
    }

    // 2. Prepara o objeto para salvar no Stories
    // Usamos || null para garantir que se vier undefined, o banco receba null
    const profileToUpsert = {
        user_id: user.id,
        facillit_id: hubProfile?.facillit_id ? String(hubProfile.facillit_id) : user.id,
        nickname: hubProfile?.nickname || user.email?.split('@')[0] || 'usuario',
        full_name: hubProfile?.full_name || 'Leitor Facillit',
        
        // --- IMAGENS VINDAS DO HUB ---
        avatar_url: hubProfile?.avatar_url || null,
        cover_image_url: hubProfile?.cover_image_url || null, // NOVO
        
        bio: hubProfile?.bio || null,
        user_category: hubProfile?.user_category || 'leitor',
        verification_badge: hubProfile?.verification_badge || null,
        updated_at: new Date().toISOString(),
    };

    // 3. Salva no Banco Local (Stories)
    const { error: syncError } = await storiesClient
      .from("profiles")
      .upsert(profileToUpsert, { onConflict: 'user_id' });

    if (syncError) {
      console.error("[Sync] Erro ao sincronizar perfil:", syncError.message);
    } 

  } catch (error) {
    console.error("[Sync] Erro crítico:", error);
  }
}