import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getProfileByUsername } from "@/services/profile";
import { Sidebar } from "@/components/layout/Sidebar";
import { Calendar, UserPlus, MessageCircle, Settings, Share2, BookOpen } from "lucide-react";

// Tipagem dos parâmetros da rota
interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

// SEO Dinâmico
export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  
  if (!profile) return { title: "Perfil não encontrado" };

  return {
    title: `${profile.full_name || profile.username} (@${profile.username}) | Facillit Stories`,
    description: profile.bio || `Confira o perfil de leitura de ${profile.username}.`,
    openGraph: { images: profile.avatar_url ? [profile.avatar_url] : [] },
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  
  // 1. Busca os dados do perfil VISITADO (Público)
  const profile = await getProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  // 2. Busca o usuário LOGADO (Server-side Auth)
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

  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // 3. Determina o Status da Relação (Visitante vs Dono)
  const isLoggedIn = !!currentUser;
  
  let isOwner = false;
  if (currentUser) {
     // Verifica se o ID do perfil visitado bate com o ID do usuário logado
     // Como sua tabela usa 'id' ou 'user_id', validamos pelo facillit_id que é único
     if (currentUser.id && profile.facillit_id) {
         // Busca simples para confirmar ownership
         const { data: myProfile } = await supabase
            .from("profiles")
            .select("facillit_id")
            .eq("id", currentUser.id) // Ajuste baseado nos seus logs (busca por ID direto)
            .maybeSingle(); // maybeSingle evita erro se não achar na primeira tentativa
         
         // Se não achou por ID, tenta por user_id (fallback)
         if (!myProfile) {
             const { data: myProfileByUserId } = await supabase
                .from("profiles")
                .select("facillit_id")
                .eq("user_id", currentUser.id)
                .maybeSingle();
             
             if (myProfileByUserId && myProfileByUserId.facillit_id === profile.facillit_id) {
                 isOwner = true;
             }
         } else if (myProfile.facillit_id === profile.facillit_id) {
             isOwner = true;
         }
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
                   // CORREÇÃO AQUI: <Image /> em vez de <image>
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

                    {/* --- ACTIONS BAR --- */}
                    <div className="flex items-center gap-3 mb-2 w-full md:w-auto justify-center md:justify-end">
                        
                        {!isLoggedIn && (
                            <a href="/login" className="px-6 py-2 bg-brand-purple text-white font-medium rounded-full hover:bg-brand-purple/90 transition-all text-sm shadow-sm flex items-center gap-2">
                                <UserPlus size={16} />
                                Seguir
                            </a>
                        )}

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

                        {isOwner && (
                            <a href="/settings" className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-full hover:bg-gray-50 transition-all text-sm shadow-sm flex items-center gap-2">
                                <Settings size={16} />
                                Editar
                            </a>
                        )}

                        <button className="p-2 border border-gray-200 text-gray-600 rounded-full hover:bg-gray-50 transition-colors">
                            <Share2 size={20} />
                        </button>
                    </div>
                </div>

                {/* Estatísticas */}
                <div className="flex gap-8 mt-8 border-t border-gray-100 pt-6 justify-center md:justify-start">
                    <div className="text-center md:text-left cursor-pointer hover:opacity-70">
                        <span className="block font-bold text-black text-xl">{profile.stats.books_read}</span>
                        <span className="text-gray-500 text-xs uppercase tracking-wide">Livros</span>
                    </div>
                    <div className="text-center md:text-left cursor-pointer hover:opacity-70">
                        <span className="block font-bold text-black text-xl">{profile.stats.followers}</span>
                        <span className="text-gray-500 text-xs uppercase tracking-wide">Seguidores</span>
                    </div>
                    <div className="text-center md:text-left cursor-pointer hover:opacity-70">
                        <span className="block font-bold text-black text-xl">{profile.stats.following}</span>
                        <span className="text-gray-500 text-xs uppercase tracking-wide">Seguindo</span>
                    </div>
                </div>
            </div>
        </div>

        {/* --- FEED --- */}
        <div className="flex-1 bg-white max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center gap-6 border-b border-gray-100 mb-6">
                    <button className="py-2 border-b-2 border-brand-purple font-semibold text-black text-sm">Feed</button>
                    <button className="py-2 border-b-2 border-transparent text-gray-500 hover:text-black transition-colors text-sm">Estantes</button>
                </div>

                <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <BookOpen className="text-gray-300" size={24} />
                    </div>
                    <h3 className="text-gray-900 font-medium mb-1">Ainda não há publicações</h3>
                    <p className="text-gray-500 text-sm max-w-xs">
                        {isOwner 
                            ? "Compartilhe sua leitura atual para começar." 
                            : `${profile.username} ainda não publicou nada.`}
                    </p>
                </div>
            </div>

            <aside className="hidden lg:block space-y-6">
                <div className="p-6 rounded-xl border border-gray-100 bg-white shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-1 h-4 bg-brand-green rounded-full"/>
                        Meta de Leitura
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Anual</span>
                            <span className="font-medium text-black">0 / 12</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-brand-green h-2 rounded-full w-[5%]" />
                        </div>
                    </div>
                </div>
            </aside>
        </div>
      </main>
    </div>
  );
}