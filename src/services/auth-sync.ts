import { SupabaseClient, User } from "@supabase/supabase-js";

export async function syncUserProfile(
  user: User, 
  hubClient: SupabaseClient, 
  storiesClient: SupabaseClient
) {
  if (!user || !user.id) return;

  try {
    // 1. Verifica se já existe
    const { data: localProfile } = await storiesClient
      .from("profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (localProfile) return; // Já existe, tudo certo.

    // 2. Busca dados originais
    let { data: hubProfile } = await hubClient
      .from("profiles")
      .select("facillit_id, nickname, full_name, avatar_url, bio, user_category, verification_badge")
      .eq("user_id", user.id)
      .maybeSingle();
    
    // Fallback se não achar no Hub
    if (!hubProfile) {
         // Tenta busca alternativa ou usa dados padrão
         hubProfile = {
            facillit_id: user.id,
            nickname: user.email?.split('@')[0] || 'admin',
            full_name: 'Usuário',
            avatar_url: null,
            bio: null,
            user_category: 'leitor',
            verification_badge: null
         };
    }

    // 3. Insere no Stories (Garante que a FK funcione)
    const { error: syncError } = await storiesClient
      .from("profiles")
      .upsert({
        user_id: user.id,
        facillit_id: String(hubProfile.facillit_id || user.id),
        nickname: hubProfile.nickname,
        full_name: hubProfile.full_name,
        avatar_url: hubProfile.avatar_url,
        bio: hubProfile.bio,
        user_category: hubProfile.user_category,
        verification_badge: hubProfile.verification_badge,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (syncError) {
      console.error("[Sync] Erro ao criar perfil local:", syncError.message);
      throw syncError; // Propaga erro para ser capturado
    } else {
      console.log("[Sync] Perfil criado/atualizado com sucesso.");
    }

  } catch (error) {
    console.error("[Sync] Erro crítico:", error);
    throw error;
  }
}