"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Definição dos Clientes
const STORIES_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const STORIES_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// Se tiver a Service Role, melhor. Se não, tentamos com a Anon.
const STORIES_ADMIN_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || STORIES_ANON_KEY;

const HUB_URL = process.env.NEXT_PUBLIC_HUB_SUPABASE_URL!;
const HUB_ANON_KEY = process.env.NEXT_PUBLIC_HUB_ANON_KEY!;

export async function sendMessageAction(content: string, receiverId: string) {
  const cookieStore = await cookies();

  // 1. Verificar Autenticação no HUB (Onde o usuário realmente está logado)
  const hubSupabase = createServerClient(HUB_URL, HUB_ANON_KEY, {
    cookies: { get(name: string) { return cookieStore.get(name)?.value; } }
  });

  const { data: { user }, error: authError } = await hubSupabase.auth.getUser();

  if (authError || !user) {
    return { error: "Usuário não autenticado no Hub." };
  }

  // 2. Conectar ao STORIES DB para escrever a mensagem
  // Usamos um cliente 'Admin' temporário para garantir que a escrita ocorra
  // mesmo que o cookie do Hub não seja válido para o Stories.
  // Injetamos o ID do usuário manualmente na query.
  const storiesSupabase = createServerClient(STORIES_URL, STORIES_ADMIN_KEY, {
    cookies: { get(name: string) { return cookieStore.get(name)?.value; } }
  });

  // Tenta inserir. Se usarmos a Service Role Key, o RLS é ignorado (sucesso garantido).
  // Se usarmos Anon Key, dependemos das políticas permitirem insert público ou sincronia de JWT.
  const { data, error } = await storiesSupabase.from("messages").insert({
    content,
    sender_id: user.id, // ID verificado no passo 1
    receiver_id: receiverId
  }).select().single();

  if (error) {
    console.error("Erro ao enviar mensagem para Stories DB:", error);
    return { error: "Falha ao registrar mensagem no banco de dados." };
  }

  return { success: true, data };
}