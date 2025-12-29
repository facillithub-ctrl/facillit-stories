import { Shell } from "@/components/layout/Shell";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();

  // ATENÇÃO: Usamos as credenciais do HUB aqui, pois é lá que a sessão do usuário reside.
  // Se usarmos o 'Stories Supabase', ele não encontrará a sessão do login unificado.
  const authSupabase = createServerClient(
    process.env.NEXT_PUBLIC_HUB_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_HUB_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  // Busca segura do usuário
  const { data: { user } } = await authSupabase.auth.getUser();

  return (
    // Passamos o user recuperado para o Shell.
    // Se user existir, a Sidebar aparece.
    <Shell user={user}>
      {children}
    </Shell>
  );
}