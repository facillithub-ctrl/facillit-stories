import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function MyProfileRedirect() {
  const cookieStore = cookies();
  
  // 1. Conectar ao HUB (onde está a Auth e o Profile original)
  const supabase = createServerClient(
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

  // 2. Verificar Sessão
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 3. Buscar o nickname (username) na tabela profiles do Hub
  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("user_id", user.id)
    .single();

  if (profile?.nickname) {
    // 4. Redirecionar para a URL correta
    redirect(`/u/${profile.nickname}`);
  } else {
    // Fallback se não tiver perfil criado
    redirect("/");
  }
}