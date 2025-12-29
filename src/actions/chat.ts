"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Definição dos Clientes
const STORIES_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const STORIES_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// Use a chave de serviço se disponível, senão anon (pode falhar se RLS for restrito)
const STORIES_ADMIN_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || STORIES_ANON_KEY;

const HUB_URL = process.env.NEXT_PUBLIC_HUB_SUPABASE_URL!;
const HUB_ANON_KEY = process.env.NEXT_PUBLIC_HUB_ANON_KEY!;

export async function sendMessageAction(content: string, receiverId: string) {
  console.log(`[SERVER_ACTION] 📨 Recebido pedido de envio para: ${receiverId}`);
  const cookieStore = await cookies();

  // 1. Verificar Autenticação no HUB
  const hubSupabase = createServerClient(HUB_URL, HUB_ANON_KEY, {
    cookies: { get(name: string) { return cookieStore.get(name)?.value; } }
  });

  const { data: { user }, error: authError } = await hubSupabase.auth.getUser();

  if (authError || !user) {
    console.error(`[SERVER_ACTION] ❌ Falha de Auth no HUB:`, authError);
    return { error: "Usuário não autenticado no Hub." };
  }

  console.log(`[SERVER_ACTION] 👤 Usuário autenticado: ${user.id}`);

  // 2. Conectar ao STORIES DB
  const storiesSupabase = createServerClient(STORIES_URL, STORIES_ADMIN_KEY, {
    cookies: { get(name: string) { return cookieStore.get(name)?.value; } }
  });

  console.log(`[SERVER_ACTION] 💾 Inserindo mensagem no Stories DB...`);
  
  const { data, error } = await storiesSupabase.from("messages").insert({
    content,
    sender_id: user.id, 
    receiver_id: receiverId
  }).select().single();

  if (error) {
    console.error(`[SERVER_ACTION] ❌ Erro ao inserir no banco Stories:`, error);
    return { error: `Falha no banco de dados: ${error.message} (${error.code})` };
  }

  console.log(`[SERVER_ACTION] ✅ Mensagem salva com sucesso! ID: ${data.id}`);
  return { success: true, data };
}