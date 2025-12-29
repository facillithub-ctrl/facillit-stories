"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { syncUserProfile } from "@/services/auth-sync"; // Importação crucial

const ADMIN_ID = "06ba69b6-807c-45a5-aad9-2013fe6edf3e";

export async function createOfficialPost(formData: FormData) {
  const cookieStore = await cookies();
  
  // 1. Cliente HUB (Validação de Auth)
  const hubSupabase = createServerClient(
    process.env.NEXT_PUBLIC_HUB_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_HUB_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { user } } = await hubSupabase.auth.getUser();

  if (!user || user.id !== ADMIN_ID) {
    throw new Error("Acesso não autorizado.");
  }

  // 2. Cliente STORIES (Banco de Dados)
  const storiesSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  // 3. SYNC CRÍTICO (AQUI ESTAVA O ERRO)
  // Antes de postar, garantimos que o perfil existe na tabela 'profiles'
  // Se pularmos isso, o banco rejeita o post (Foreign Key Violation)
  try {
      await syncUserProfile(user, hubSupabase, storiesSupabase);
  } catch (syncErr) {
      console.error("Aviso: Falha no sync pré-postagem", syncErr);
      // Tentamos prosseguir mesmo assim, caso o SQL manual já tenha resolvido
  }

  // 4. Coletar Dados
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const imageUrl = formData.get("image_url") as string;
  const priority = formData.get("priority") as string;
  const allowComments = formData.get("allow_comments") === "on";

  if (!content) {
    throw new Error("Conteúdo é obrigatório.");
  }

  // 5. Inserir Post
  const { error } = await storiesSupabase.from("posts").insert({
    user_id: user.id,
    title: title || null,
    content: content,
    image_url: imageUrl || null,
    allow_comments: allowComments,
    is_official: true,
    priority_level: priority === "high" ? 100 : 50,
    pinned: true,
  });

  if (error) {
    // Log detalhado no servidor para você ver o motivo real (ex: RLS, FK, etc)
    console.error("Erro DETALHADO do Supabase:", error);
    throw new Error(`Falha ao salvar post: ${error.message}`);
  }

  redirect("/");
}