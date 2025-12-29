import { createClient } from "@supabase/supabase-js";

// Definição do Tipo Profile (conforme SQL anterior)
export interface Profile {
  facillit_id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null; // Adicionado cover_url
  created_at: string;
}

// Cliente Supabase (usando variáveis de ambiente)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Busca um perfil público pelo username.
 * Esta função roda no servidor ou cliente, mas idealmente usada em Server Components.
 */
export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error) {
    console.error("Erro ao buscar perfil:", error.message);
    return null;
  }

  return data as Profile;
}