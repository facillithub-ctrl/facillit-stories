import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { User } from "@supabase/supabase-js";

// Definição estrita dos tipos (Zero 'any')
interface HubProfile {
  id: string; // Auth ID
  facillit_id: string;
  nickname: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  user_category: string | null;
  verification_badge: string | null;
}

/**
 * Sincroniza o perfil do Hub para o banco local do Stories.
 * Deve ser chamado no Layout ou Page principal.
 */
export async function syncUserProfile(
  user: User, 
  hubClient: SupabaseClient, 
  storiesClient: SupabaseClient
): Promise<void> {
  try {
    // 1. Verifica se o perfil JÁ existe no banco local (Stories)
    const { data: localProfile } = await storiesClient
      .from("profiles")
      .select("updated_at")
      .eq("user_id", user.id)
      .single();

    // Se já existe e foi atualizado recentemente, não faz nada (Cache de 1 hora, por exemplo, ou simples existência)
    // Para MVP, se existir, assumimos que está ok. Futuramente podemos comparar datas.
    if (localProfile) {
      return;
    }

    // 2. Se não existe, busca os dados ORIGINAIS no Hub
    const { data: hubProfile, error: hubError } = await hubClient
      .from("profiles")
      .select("id, facillit_id, nickname, full_name, avatar_url, bio, user_category, verification_badge")
      .eq("user_id", user.id)
      .single();

    if (hubError || !hubProfile) {
      console.error("Erro ao buscar perfil no Hub para sincronia:", hubError);
      return;
    }

    // 3. Insere/Atualiza no banco local (Stories)
    // Importante: A tabela 'profiles' no Stories deve ter os mesmos campos.
    const profileData = hubProfile as HubProfile;

    const { error: syncError } = await storiesClient
      .from("profiles")
      .upsert({
        user_id: user.id, // Chave de vínculo
        facillit_id: profileData.facillit_id,
        nickname: profileData.nickname,
        full_name: profileData.full_name,
        avatar_url: profileData.avatar_url,
        bio: profileData.bio,
        user_category: profileData.user_category,
        verification_badge: profileData.verification_badge,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (syncError) {
      console.error("Erro ao salvar perfil no Stories:", syncError);
    } else {
      console.log(`✅ Perfil sincronizado: ${profileData.nickname}`);
    }

  } catch (error) {
    console.error("Falha crítica na sincronização:", error);
  }
}