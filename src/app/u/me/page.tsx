import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AlertCircle, Home } from "lucide-react";
import Link from "next/link";

export default async function MyProfileRedirect() {
  const cookieStore = await cookies();
  
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

  // 1. Verifica Autenticação
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Tenta buscar perfil (Estratégia Dupla: user_id ou id)
  // Seus logs confirmaram que a busca por 'id' é a que funciona no seu banco.
  
  // Tentativa A: Padrão (user_id)
  let { data: profile } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("user_id", user.id)
    .single();

  // Tentativa B: Fallback (id direto)
  if (!profile) {
    const { data: profileById } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", user.id)
        .single();
    
    if (profileById) {
        profile = profileById;
    }
  }

  // 3. Sucesso: Redireciona
  if (profile?.nickname) {
    redirect(`/u/${profile.nickname}`);
  }

  // 4. Falha Total: Mostra Erro Amigável
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="text-red-500" size={24} />
        </div>
        
        <h1 className="text-xl font-bold text-gray-900 mb-2">Perfil não encontrado</h1>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          Sua conta existe ({user.email}), mas não encontramos um perfil de leitor associado.
        </p>

        <Link 
          href="/"
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
        >
          <Home size={16} />
          Voltar para o Início
        </Link>
      </div>
    </div>
  );
}