import { createBrowserClient } from "@supabase/ssr";

// 1. Cliente HUB (Autenticação e Perfil Base)
// Usamos createBrowserClient para garantir que os cookies sejam setados corretamente
// e lidos pelo Middleware.
export const hubClient = createBrowserClient(
  process.env.NEXT_PUBLIC_HUB_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_HUB_ANON_KEY!
);

// 2. Cliente STORIES (Dados da Rede Social)
export const storiesClient = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);