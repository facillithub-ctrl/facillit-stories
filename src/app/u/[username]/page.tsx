import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getProfileByUsername } from "@/services/profile";
import { Sidebar } from "@/components/layout/Sidebar";
import { VerificationBadge } from "@/components/ui/VerificationBadge"; 
import { Calendar, UserPlus, MessageCircle, Settings, Share2, BookOpen, Edit3, LogIn, MapPin } from "lucide-react";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) return { title: "Perfil não encontrado" };
  return {
    title: `${profile.full_name || profile.username} (@${profile.username})`,
    description: profile.bio || `Confira o perfil de leitura de ${profile.username}.`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);

  if (!profile) notFound();

  // --- CONTEXTO (Server Side) ---
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_HUB_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_HUB_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const isLoggedIn = !!currentUser;
  
  let isOwner = false;
  if (currentUser && profile.facillit_id) {
    const { data: myProfile } = await supabase
        .from("profiles")
        .select("facillit_id")
        .eq("user_id", currentUser.id)
        .maybeSingle();

    if (myProfile?.facillit_id === profile.facillit_id) {
        isOwner = true;
    }
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      
      {/* Sidebar: Só renderiza se estiver logado (passamos o currentUser) */}
      {isLoggedIn && <Sidebar user={currentUser} />}
      
      {/* LAYOUT ADJUSTMENT:
         lg:pl-64 -> Padding só se estiver logado (já que a sidebar só aparece logado).
         Se não estiver logado, ocupa a tela toda (pl-0).
      */}
      <main className={`w-full min-h-screen flex flex-col transition-all duration-300 ${isLoggedIn ? 'lg:pl-64' : ''}`}>
        
        {/* --- HEADER CLEAN (Seamless) --- */}
        <div className="relative">
            {/* Capa */}
            <div className="h-40 md:h-56 w-full relative bg-gray-50 group">
                {profile.cover_url ? (
                   <Image 
                     src={profile.cover_url} 
                     alt="Capa" 
                     fill 
                     className="object-cover opacity-95"
                     priority
                   />
                ) : (
                   <div className="w-full h-full bg-brand-gradient opacity-90" />
                )}
                
                {isOwner && (
                    <button className="absolute bottom-4 right-4 bg-white/90 backdrop-blur text-xs font-medium px-3 py-1.5 rounded-full shadow-sm hover:bg-white transition-all flex items-center gap-1.5">
                        <Edit3 size={12} /> Editar capa
                    </button>
                )}
            </div>

            <div className="max-w-4xl mx-auto px-6">
                <div className="relative -mt-12 flex flex-col md:flex-row items-start gap-6 pb-8 border-b border-gray-100">
                    
                    {/* Avatar */}
                    <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full ring-4 ring-white bg-white overflow-hidden shrink-0 shadow-sm z-10">
                        {profile.avatar_url ? (
                            <Image src={profile.avatar_url} alt={profile.username} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gray-50 flex items-center justify-center text-3xl font-bold text-gray-300">
                                {profile.username[0].toUpperCase()}
                            </div>
                        )}
                    </div>

                    {/* Informações (Letras menores e espaçamento ajustado) */}
                    <div className="flex-1 w-full pt-14 md:pt-14">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-black flex items-center gap-2">
                                    {profile.full_name || profile.username}
                                    <VerificationBadge badge={profile.verification_badge} size="md" />
                                </h1>
                                <p className="text-sm text-gray-500 font-medium">@{profile.username}</p>
                            </div>

                            {/* Actions (Desktop) */}
                            <div className="hidden md:flex items-center gap-2">
                                {!isLoggedIn && (
                                    <a href="/login" className="bg-black text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-gray-800 transition-colors">
                                        Entrar para Seguir
                                    </a>
                                )}
                                {isLoggedIn && !isOwner && (
                                    <button className="bg-brand-gradient text-white text-xs font-semibold px-4 py-2 rounded-full hover:opacity-90 transition-opacity">
                                        Seguir
                                    </button>
                                )}
                                {isOwner && (
                                    <a href="/settings" className="border border-gray-200 text-gray-700 text-xs font-medium px-4 py-2 rounded-full hover:bg-gray-50 transition-colors">
                                        Editar Perfil
                                    </a>
                                )}
                                <button className="p-2 text-gray-400 hover:text-black transition-colors"><Share2 size={16} /></button>
                            </div>
                        </div>

                        {profile.bio && (
                            <p className="mt-4 text-sm text-gray-700 leading-relaxed max-w-2xl font-normal">
                                {profile.bio}
                            </p>
                        )}

                        <div className="flex items-center gap-6 mt-4 text-xs text-gray-500">
                             {profile.user_category && (
                                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 rounded text-gray-600 font-medium border border-gray-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green"/>
                                    {profile.user_category}
                                </span>
                             )}
                             <div className="flex items-center gap-1">
                                <Calendar size={12} />
                                <span>{new Date(profile.created_at).getFullYear()}</span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Actions (Mobile Only) */}
                <div className="md:hidden flex items-center gap-2 py-4 border-b border-gray-100">
                     {/* Mesma lógica de botões acima, versão mobile width-full */}
                     {!isLoggedIn ? (
                        <a href="/login" className="flex-1 bg-black text-white text-sm font-medium py-2 rounded-lg text-center">Entrar</a>
                     ) : !isOwner ? (
                        <button className="flex-1 bg-brand-gradient text-white text-sm font-medium py-2 rounded-lg">Seguir</button>
                     ) : (
                        <a href="/settings" className="flex-1 border border-gray-200 text-sm font-medium py-2 rounded-lg text-center">Editar</a>
                     )}
                </div>

                {/* Stats Seamless (Sem cards) */}
                <div className="flex gap-12 py-6 border-b border-gray-100">
                     <div className="cursor-pointer hover:opacity-70 transition-opacity">
                        <span className="block text-lg font-bold text-black">{profile.stats.books_read}</span>
                        <span className="text-xs text-gray-500 font-medium">LIVROS</span>
                     </div>
                     <div className="cursor-pointer hover:opacity-70 transition-opacity">
                        <span className="block text-lg font-bold text-black">{profile.stats.followers}</span>
                        <span className="text-xs text-gray-500 font-medium">SEGUIDORES</span>
                     </div>
                     <div className="cursor-pointer hover:opacity-70 transition-opacity">
                        <span className="block text-lg font-bold text-black">{profile.stats.following}</span>
                        <span className="text-xs text-gray-500 font-medium">SEGUINDO</span>
                     </div>
                </div>
            </div>

        </div>

        {/* --- ÁREA DE CONTEÚDO (3 Colunas Conceituais, Fundo Branco) --- */}
        <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Feed Principal */}
            <div className="lg:col-span-2">
                {/* Tabs Minimalistas */}
                <div className="flex items-center gap-6 mb-8 border-b border-gray-100 pb-1px">
                    <button className="text-sm font-semibold text-black border-b-2 border-brand-purple pb-3 -mb-[2px]">
                        Atividades
                    </button>
                    <button className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors pb-3">
                        Estantes
                    </button>
                    <button className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors pb-3">
                        Resenhas
                    </button>
                </div>

                {/* Empty State Integrado (Sem borda grossa) */}
                <div className="py-12 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BookOpen className="text-gray-300" size={20} />
                    </div>
                    <p className="text-sm text-gray-900 font-medium">Nenhuma atividade recente</p>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                        {isOwner 
                            ? "Suas leituras e anotações aparecerão aqui." 
                            : "Este usuário ainda não compartilhou atualizações."}
                    </p>
                </div>
            </div>

            {/* Sidebar Direita (Informações Contextuais) */}
            <aside className="hidden lg:block space-y-8">
                
                {/* Meta de Leitura (Clean) */}
                <div>
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                         <span className="w-1.5 h-1.5 bg-brand-green rounded-full" />
                         Meta 2025
                    </h3>
                    <div className="flex items-baseline gap-1 mb-2">
                         <span className="text-2xl font-bold text-black">0</span>
                         <span className="text-xs text-gray-400">/ 12 livros</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-brand-gradient h-full w-[2%] rounded-full" />
                    </div>
                </div>

                {/* Bio Extra / Links (Se houver) */}
                {/* Aqui entrarão widgets futuros como "Lendo Agora" */}

            </aside>

        </div>
      </main>
    </div>
  );
}