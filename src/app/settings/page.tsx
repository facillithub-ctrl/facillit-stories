import { Sidebar } from "@/components/layout/Sidebar";
import { User, Eye, Lock, Palette } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  // CORREÇÃO NEXT.js 15: cookies() agora é assíncrono
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_HUB_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_HUB_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, full_name")
    .eq("user_id", user.id)
    .single();

  const username = profile?.nickname || "me";

  return (
    <div className="flex min-h-screen bg-white text-black">
      <Sidebar />
      
      <main className="flex-1 lg:ml-64 p-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">Configurações</h1>
        <p className="text-gray-500 mb-8">Gerencie a sua identidade no Facillit Stories.</p>

        <div className="grid gap-6">
          
          {/* Cartão de Perfil */}
          <section className="border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="p-3 bg-brand-purple/10 rounded-lg text-brand-purple">
                  <User size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Perfil Público</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Este é o perfil visível para outros leitores.
                  </p>
                  <p className="text-xs text-gray-400 mt-2 font-mono">
                    facillit.com/u/{username}
                  </p>
                </div>
              </div>
              
              <Link 
                href={`/u/${username}`} 
                className="flex items-center gap-2 text-sm font-medium text-brand-purple hover:text-brand-green transition-colors"
              >
                <Eye size={16} />
                Visualizar Perfil
              </Link>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-50 flex gap-4">
              <button className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
                Editar Dados
              </button>
            </div>
          </section>

          {/* Outras Configurações */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-gray-100 rounded-xl p-6 opacity-75">
              <Lock className="w-6 h-6 text-gray-400 mb-4" />
              <h3 className="font-semibold mb-2">Privacidade</h3>
              <p className="text-sm text-gray-500">Quem pode ver as suas estantes e anotações.</p>
            </div>
            
            <div className="border border-gray-100 rounded-xl p-6 opacity-75">
              <Palette className="w-6 h-6 text-gray-400 mb-4" />
              <h3 className="font-semibold mb-2">Aparência</h3>
              <p className="text-sm text-gray-500">Tema claro/escuro e tamanho da fonte.</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}