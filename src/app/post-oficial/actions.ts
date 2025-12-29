"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { syncUserProfile } from "@/services/auth-sync";

const ADMIN_ID = "06ba69b6-807c-45a5-aad9-2013fe6edf3e";

export async function createOfficialPost(formData: FormData) {
  const cookieStore = await cookies();
  
  // ----------------------------------------------------------------
  // 1. VALIDAÇÃO DE IDENTIDADE (Usando o HUB)
  // ----------------------------------------------------------------
  const hubSupabase = createServerClient(
    process.env.NEXT_PUBLIC_HUB_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_HUB_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { user } } = await hubSupabase.auth.getUser();

  if (!user || user.id !== ADMIN_ID) {
    throw new Error("Acesso negado. Você não é o administrador.");
  }

  // ----------------------------------------------------------------
  // 2. CONEXÃO COM STORIES (Sem cookies, modo 'Server-to-Server')
  // ----------------------------------------------------------------
  // Nota: Não passamos cookies aqui para evitar conflito de tokens entre projetos.
  // Confiamos na política RLS "Admin Insert Override" criada no SQL.
  const storiesSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return undefined; } } }
  );

  // 3. Sync de Segurança (Garante que o perfil existe)
  try {
      await syncUserProfile(user, hubSupabase, storiesSupabase);
  } catch (e) {
      console.warn("Sync warning:", e);
  }

  // 4. Preparar Dados
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
    console.error("Erro SQL Supabase:", error);
    throw new Error(`Falha ao salvar: ${error.message} (Dica: Rode o SQL de correção de RLS)`);
  }

  redirect("/");
}