import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { cookies } from "next/headers"; // Necessário para checar sessão no Server Component
import { createServerClient } from "@supabase/ssr";

import { getProfileByUsername } from "@/services/profile";
import { Sidebar } from "@/components/layout/Sidebar";
import { Calendar, UserPlus, MessageCircle, Settings, Share2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

// Tipagem dos parâmetros da rota
interface ProfilePageProps {
  params: { username: string };
}

// SEO Dinâmico
export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const profile = await getProfileByUsername(params.username);
  if (!profile) return { title: "Perfil não encontrado" };
  return {
    title: `${profile.full_name || profile.username} (@${profile.username}) | Facillit Stories`,
    description: profile.bio || `Confira o perfil de leitura de ${profile.username}.`,
    openGraph: { images: profile.avatar_url ? [profile.avatar_url] : [] },
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  // 1. Busca os dados do perfil VISITADO (Público)
  const profile = await getProfileByUsername(params.username);

  if (!profile) {
    notFound();
  }

  // 2. Busca o usuário LOGADO (Para determinar permissões)
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_HUB_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_HUB_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
      },
    }
  );

  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // 3. Determina o Status da Relação
  const isLoggedIn = !!currentUser;
  
  // Para saber se é o dono, precisamos comparar um ID único.
  // O currentUser.id do Auth é diferente do facillit_id, mas o Auth ID está vinculado no Hub.
  // Idealmente, compararíamos facillit_id, mas por segurança rápida, comparamos se o email bate ou se buscamos o facillit_id do logado.
  // Neste MVP, vamos assumir que NÃO É o dono se não conseguirmos validar, ou verificar se o username bate (se o usuário logado tiver metadata).
  
  // Estratégia mais segura: Buscar o facillit_id do usuário logado
  let isOwner = false;
  if (currentUser) {
     // Pequena query para saber o ID do logado
     const { data: myProfile } = await supabase
        .from("profiles")
        .select("facillit_id")
        .eq("user_id", currentUser.id) // user_id do Auth linka com user_id da tabela profiles
        .single();
     
     if (myProfile && myProfile.facillit_id === profile.facillit_id) {
         isOwner = true;
     }
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      
      <main className="flex-1 lg:ml-64 w-full min-h-screen flex flex-col">
        
        {/* --- TOP BAR (Identidade Hub) --- */}
        <div className="relative bg-white border-b border-gray-100">
            
            {/* Capa */}
            <div className="h-48 md:h-60 w-full relative bg-gray-50 overflow-hidden group">
                {profile.cover_url ? (
                   <Image 
                     src={profile.cover_url} 
                     alt="Capa" 
                     fill 
                     className="object-cover"
                     priority
                   />
                ) : (
                   <div className="w-full h-full bg-brand-gradient opacity-90" />
                )}
                {/* Botão de editar capa (apenas dono) */}
                {isOwner && (
                    <button className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
                        <Settings size={16} />
                    </button>
                )}
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-6">
                <div className="relative -mt-16 flex flex-col md:flex-row items-end md:items-end gap-6">
                    
                    {/* Avatar */}
                    <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-sm bg-white overflow-hidden shrink-0">
                        {profile.avatar_url ? (
                            <Image 
                            src={profile.avatar_url} 
                            alt={profile.username} 
                            fill 
                            className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-4xl font-bold text-gray-300 select-none">
                                {profile.username[0].toUpperCase()}
                            </div>
                        )}
                    </div>

                    {/* Informações Principais */}
                    <div className="flex-1 text-center md:text-left mb-2">
                        <h1 className="text-2xl font-bold text-black flex items-center justify-center md:justify-start gap-2">
                            {profile.full_name || profile.username}
                        </h1>
                        <p className="text-gray-500 font-medium">@{profile.username}</p>
                        
                        {/* Bio Curta */}
                        {profile.bio && (
                            <p className="mt-2 text-gray-800 text-sm max-w-xl mx-auto md:mx-0 leading-relaxed line-clamp-2">
                                {profile.bio}
                            </p>
                        )}

                        <div className="flex items-center justify-center md:justify-start gap-4 mt-3 text-xs text-gray-400 font-medium uppercase tracking-wider">
                            {profile.user_category && (
                                <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">{profile.user_category}</span>
                            )}
                            <div className="flex items-center gap-1">
                                <Calendar size={12} />
                                <span>Desde {new Date(profile.created_at).getFullYear()}</span>
                            </div>
                        </div>
                    </div>

                    {/* --- ACTIONS BAR (Lógica de Interação) --- */}
                    <div className="flex items-center gap-3 mb-2 w-full md:w-auto justify-center md:justify-end">
                        
                        {/* Cenário 1: Usuário NÃO Logado */}
                        {!isLoggedIn && (
                            <a href="/login" className="px-6 py-2 bg-brand-purple text-white font-medium rounded-full hover:bg-brand-purple/90 transition-all text-sm shadow-sm flex items-center gap-2">
                                <UserPlus size={16} />
                                Seguir
                            </a>
                        )}

                        {/* Cenário 2: Usuário Logado vendo OUTRO perfil */}
                        {isLoggedIn && !isOwner && (
                            <>
                                <button className="px-6 py-2 bg-black text-white font-medium rounded-full hover:bg-gray-800 transition-all text-sm shadow-sm flex items-center gap-2">
                                    <UserPlus size={16} />
                                    Seguir
                                </button>
                                <button className="p-2 border border-gray-200 text-gray-600 rounded-full hover:bg-gray-50 transition-colors">
                                    <MessageCircle size={20} />
                                </button>
                            </>
                        )}

                        {/* Cenário 3: Dono do Perfil */}
                        {isOwner && (
                            <a href="/settings" className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-full hover:bg-gray-50 transition-all text-sm shadow-sm flex items-center gap-2">
                                <Settings size={16} />
                                Editar Perfil
                            </a>
                        )}

                        {/* Botão Comum: Compartilhar */}
                        <button className="p-2 border border-gray-200 text-gray-600 rounded-full hover:bg-gray-50 transition-colors" title="Compartilhar Perfil">
                            <Share2 size={20} />
                        </button>
                    </div>
                </div>

                {/* Estatísticas (Stories Data) */}
                <div className="flex gap-8 mt-8 border-t border-gray-100 pt-6 justify-center md:justify-start">
                    <div className="text-center md:text-left cursor-pointer hover:opacity-70 transition-opacity">
                        <span className="block font-bold text-black text-xl">{profile.stats.books_read}</span>
                        <span className="text-gray-500 text-xs uppercase tracking-wide">Livros</span>
                    </div>
                    <div className="text-center md:text-left cursor-pointer hover:opacity-70 transition-opacity">
                        <span className="block font-bold text-black text-xl">{profile.stats.followers}</span>
                        <span className="text-gray-500 text-xs uppercase tracking-wide">Seguidores</span>
                    </div>
                    <div className="text-center md:text-left cursor-pointer hover:opacity-70 transition-opacity">
                        <span className="block font-bold text-black text-xl">{profile.stats.following}</span>
                        <span className="text-gray-500 text-xs uppercase tracking-wide">Seguindo</span>
                    </div>
                </div>
            </div>
        </div>

        {/* --- FEED AREA (Stories Content) --- */}
        <div className="flex-1 bg-white max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Coluna Principal: Posts e Atividades */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Tabs de Navegação */}
                <div className="flex items-center gap-6 border-b border-gray-100 mb-6">
                    <button className="py-2 border-b-2 border-brand-purple font-semibold text-black text-sm">
                        Feed
                    </button>
                    <button className="py-2 border-b-2 border-transparent text-gray-500 hover:text-black transition-colors text-sm">
                        Estantes
                    </button>
                    <button className="py-2 border-b-2 border-transparent text-gray-500 hover:text-black transition-colors text-sm">
                        Resenhas
                    </button>
                </div>

                {/* Empty State / Placeholder Feed */}
                <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <BookOpen className="text-gray-300" size={24} />
                    </div>
                    <h3 className="text-gray-900 font-medium mb-1">Ainda não há publicações</h3>
                    <p className="text-gray-500 text-sm max-w-xs">
                        {isOwner 
                            ? "Compartilhe sua leitura atual ou escreva uma resenha para começar." 
                            : `${profile.username} ainda não publicou nada no Facillit Stories.`}
                    </p>
                    {isOwner && (
                        <button className="mt-4 text-brand-purple font-medium text-sm hover:underline">
                            Criar primeira postagem
                        </button>
                    )}
                </div>
            </div>

            {/* Coluna Lateral: Metas e Detalhes (Stories Data) */}
            <aside className="hidden lg:block space-y-6">
                <div className="p-6 rounded-xl border border-gray-100 bg-white shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-1 h-4 bg-brand-green rounded-full"/>
                        Meta de Leitura
                    </h3>
                    {/* Placeholder Meta */}
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Anual</span>
                            <span className="font-medium text-black">0 / 12 livros</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-brand-green h-2 rounded-full w-[5%]" />
                        </div>
                        <p className="text-xs text-gray-400">Iniciante na jornada.</p>
                    </div>
                </div>
            </aside>

        </div>

      </main>
    </div>
  );
}