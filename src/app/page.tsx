import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { Sidebar } from "@/components/layout/Sidebar";
import { 
  BookOpen, 
  PenTool, 
  Search, 
  TrendingUp, 
  MoreHorizontal, 
  MessageSquare, 
  Heart 
} from "lucide-react";

// Função auxiliar para saudação temporal
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
};

export default async function Dashboard() {
  // 1. Configuração do Cliente Supabase (Server Side)
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

  // 2. Verificação de Sessão
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 3. Busca de Dados Reais do Usuário (Identidade Hub)
  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, full_name, avatar_url, user_category, verification_badge")
    .eq("user_id", user.id)
    .single();
    
  // Fallback seguro se o perfil não estiver completo
  const displayName = profile?.full_name?.split(" ")[0] || profile?.nickname || "Leitor";
  const username = profile?.nickname || "me";

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      
      {/* Sidebar Fixa (Passamos o usuário para controle interno) */}
      <Sidebar user={user} />

      {/* LAYOUT PRINCIPAL (3 Colunas Conceituais)
         ml-64: Compensa a Sidebar fixa
         max-w-7xl: Limita a largura em telas ultra-wide
      */}
      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-8">
            
          {/* --- COLUNA CENTRAL (FEED) - Ocupa 8 colunas --- */}
          <div className="lg:col-span-8 px-6 py-8 border-r border-gray-50 min-h-screen">
            
            {/* Header de Boas Vindas */}
            <header className="mb-10">
              <h1 className="text-3xl font-bold tracking-tight text-black mb-1">
                {getGreeting()}, <span className="text-transparent bg-clip-text bg-brand-gradient">{displayName}</span>.
              </h1>
              <p className="text-gray-500 font-medium text-sm">
                Pronto para sua próxima leitura?
              </p>
            </header>

            {/* Ações Rápidas (Quick Actions) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
               <button className="group flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-brand-purple/20 hover:shadow-md transition-all duration-300">
                  <div className="w-10 h-10 rounded-full bg-brand-purple/10 flex items-center justify-center text-brand-purple mb-3 group-hover:scale-110 transition-transform">
                    <BookOpen size={20} />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Registrar Leitura</span>
               </button>

               <button className="group flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-brand-purple/20 hover:shadow-md transition-all duration-300">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-3 group-hover:scale-110 transition-transform">
                    <PenTool size={20} />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Escrever Resenha</span>
               </button>

               <button className="group flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-brand-purple/20 hover:shadow-md transition-all duration-300 sm:col-span-1 col-span-2">
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 mb-3 group-hover:scale-110 transition-transform">
                    <Search size={20} />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Explorar Livros</span>
               </button>
            </div>

            {/* Separador Sutil */}
            <div className="h-px w-full bg-gray-100 mb-8" />

            {/* Feed Tabs */}
            <div className="flex items-center justify-between mb-6">
               <div className="flex gap-6">
                  <button className="text-base font-bold text-black border-b-2 border-brand-purple pb-1">
                    Seguindo
                  </button>
                  <button className="text-base font-medium text-gray-400 hover:text-gray-600 transition-colors pb-1">
                    Explorar
                  </button>
                  <button className="text-base font-medium text-gray-400 hover:text-gray-600 transition-colors pb-1">
                    Clubes
                  </button>
               </div>
               
               {/* Filtro (Opcional) */}
               <button className="text-xs font-semibold text-gray-400 hover:text-black uppercase tracking-wider">
                  Mais Recentes
               </button>
            </div>

            {/* Feed Content (Real Empty State) */}
            <div className="space-y-6">
               {/* Como não temos posts ainda, mostramos o estado inicial "Onboarding de Feed" */}
               
               {/* Card 1: Boas vindas do Sistema */}
               <article className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-bold text-xs">
                           FS
                        </div>
                        <div>
                           <h4 className="font-bold text-gray-900 text-sm">Equipe Facillit Stories</h4>
                           <p className="text-xs text-gray-500">Oficial • Há 2 minutos</p>
                        </div>
                     </div>
                     <button className="text-gray-400 hover:text-black">
                        <MoreHorizontal size={20} />
                     </button>
                  </div>
                  
                  <div className="mb-4">
                     <h3 className="font-bold text-lg text-gray-900 mb-2">Bem-vindo ao início de uma nova era de leitura.</h3>
                     <p className="text-gray-600 leading-relaxed text-sm">
                        O Facillit Stories foi criado para quem lê de verdade. Aqui, não corremos atrás de likes, mas de boas conversas. 
                        Comece atualizando seu perfil e registrando seu primeiro livro.
                     </p>
                  </div>

                  <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
                     <button className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors text-sm font-medium">
                        <Heart size={18} />
                        <span>Curtir</span>
                     </button>
                     <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors text-sm font-medium">
                        <MessageSquare size={18} />
                        <span>Comentar</span>
                     </button>
                  </div>
               </article>

               {/* Card 2: Empty State Personalizado */}
               <div className="py-12 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <h3 className="text-gray-900 font-bold mb-2">Seu feed está silencioso... por enquanto.</h3>
                  <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                    Siga leitores, entre em clubes ou registre sua primeira leitura para ver este espaço ganhar vida.
                  </p>
                  <Link href="/library" className="px-6 py-2.5 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-all">
                     Encontrar Leitores
                  </Link>
               </div>
            </div>

          </div>

          {/* --- COLUNA DIREITA (CONTEXTO) - Ocupa 4 colunas --- */}
          <aside className="hidden lg:block lg:col-span-4 px-6 py-8 h-screen sticky top-0">
            
            {/* Widget: Perfil Mini */}
            <div className="flex items-center gap-3 mb-8 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
               <div className="w-12 h-12 rounded-full border border-gray-100 overflow-hidden relative">
                  {profile?.avatar_url ? (
                    <Image src={profile.avatar_url} alt="Eu" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-brand-gradient flex items-center justify-center text-white font-bold">
                       {username[0].toUpperCase()}
                    </div>
                  )}
               </div>
               <div className="flex-1">
                  <h3 className="font-bold text-sm text-gray-900 group-hover:text-brand-purple transition-colors">
                     {profile?.full_name || username}
                  </h3>
                  <p className="text-xs text-gray-500">@{username}</p>
               </div>
            </div>

            {/* Widget: Leitura Atual */}
            <div className="mb-8">
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                  Lendo Agora
               </h3>
               {/* Empty State de Leitura */}
               <div className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm flex items-center gap-4 opacity-70">
                  <div className="w-12 h-16 bg-gray-200 rounded-md flex-shrink-0" />
                  <div>
                     <p className="text-sm font-bold text-gray-900">Nenhum livro ativo</p>
                     <p className="text-xs text-gray-500 mt-1">Que tal começar um?</p>
                  </div>
               </div>
            </div>

            {/* Widget: Meta de Leitura */}
            <div className="mb-8">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                     Meta 2025
                  </h3>
                  <Link href="/settings" className="text-xs font-semibold text-brand-purple hover:underline">
                     Definir
                  </Link>
               </div>
               
               <div className="p-5 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-baseline gap-1 mb-2">
                     <span className="text-2xl font-bold text-gray-900">0</span>
                     <span className="text-xs text-gray-500 font-medium">/ 12 livros</span>
                  </div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                     <div className="bg-brand-green h-full w-[2%]" />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-3 font-medium">
                     0% da meta alcançada.
                  </p>
               </div>
            </div>

            {/* Widget: Tendências (Estático por enquanto) */}
            <div>
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <TrendingUp size={12} />
                  Em Alta no Facillit
               </h3>
               <ul className="space-y-4">
                  {[1, 2, 3].map((_, i) => (
                     <li key={i} className="flex gap-3 items-start group cursor-pointer">
                        <span className="text-sm font-bold text-gray-300 group-hover:text-brand-purple">0{i + 1}</span>
                        <div>
                           <p className="text-sm font-semibold text-gray-900 group-hover:text-brand-purple transition-colors">
                              Literatura Clássica
                           </p>
                           <p className="text-xs text-gray-500">1.2k discussões</p>
                        </div>
                     </li>
                  ))}
               </ul>
            </div>

          </aside>

        </div>
      </main>
    </div>
  );
}