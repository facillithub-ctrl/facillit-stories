"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// ID do Admin Supremo (Sua conta)
const ADMIN_ID = "06ba69b6-807c-45a5-aad9-2013fe6edf3e";

export async function createOfficialPost(formData: FormData) {
  // 1. Recuperar cookies (Next.js 15 exige await)
  const cookieStore = await cookies();
  
  // ---------------------------------------------------------
  // ETAPA 1: Validar Identidade no HUB (Auth)
  // ---------------------------------------------------------
  const hubSupabase = createServerClient(
    process.env.NEXT_PUBLIC_HUB_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_HUB_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await hubSupabase.auth.getUser();

  // Segurança Rígida: Aborta se não for o Admin
  if (!user || user.id !== ADMIN_ID) {
    throw new Error("Acesso não autorizado. Apenas o administrador pode realizar esta ação.");
  }

  // ---------------------------------------------------------
  // ETAPA 2: Processar Dados do Formulário
  // ---------------------------------------------------------
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const imageUrl = formData.get("image_url") as string;
  const priority = formData.get("priority") as string;
  
  // Checkboxes HTML enviam "on" se marcados, ou null se desmarcados
  const allowComments = formData.get("allow_comments") === "on";

  if (!content) {
    throw new Error("O conteúdo do post é obrigatório.");
  }

  // ---------------------------------------------------------
  // ETAPA 3: Salvar no Banco STORIES (Dados)
  // ---------------------------------------------------------
  const storiesSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { error } = await storiesSupabase.from("posts").insert({
    user_id: user.id,
    title: title || null,        // Novo campo
    content: content,
    image_url: imageUrl || null, // Novo campo
    allow_comments: allowComments, // Novo campo
    
    is_official: true,           // Sempre true aqui
    priority_level: priority === "high" ? 100 : 50, // 100 = Topo Absoluto
    pinned: true,                // Fixado por padrão
    
    // created_at é gerado automaticamente pelo Banco
  });

  if (error) {
    console.error("Erro crítico ao criar post oficial:", error);
    throw new Error("Falha ao salvar post no banco de dados.");
  }

  // ---------------------------------------------------------
  // ETAPA 4: Finalização
  // ---------------------------------------------------------
  // Redireciona para a Home para ver o post publicado
  redirect("/");
}