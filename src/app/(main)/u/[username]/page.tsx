import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getProfileByUsername } from "@/services/profile";
import { VerificationBadge } from "@/components/ui/VerificationBadge"; 
import { Calendar, Share2, BookOpen, Edit3, MessageCircle } from "lucide-react";

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

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_HUB_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_HUB_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const isLoggedIn = !!currentUser;
  
  const isOwner = currentUser && currentUser.id === profile.user_id;

  return (
    <>
        <div className="relative animate-in fade-in duration-500">
            {/* Capa */}
            <div className="h-40 md:h-64 w-full relative bg-gray-50 group">
                {profile.cover_url ? (
                   <Image src={profile.cover_url} alt="Capa" fill className="object-cover opacity-95" priority />
                ) : (
                   <div className="w-full h-full bg-gradient-to-r from-gray-100 to-gray-50" />
                )}
                {isOwner && (
                    <button className="absolute bottom-4 right-4 bg-white/80 backdrop-blur text-xs font-bold px-4 py-2 rounded-full hover:bg-white transition-all flex items-center gap-2 shadow-sm z-10">
                        <Edit3 size={14} /> Editar capa
                    </button>
                )}
            </div>

            <div className="max-w-5xl mx-auto px-6">
                <div className="relative -mt-16 flex flex-col md:flex-row items-end md:items-start gap-6 pb-6 border-b border-gray-50">
                    
                    {/* Avatar */}
                    <div className="relative w-32 h-32 rounded-full ring-4 ring-white bg-white overflow-hidden shrink-0 shadow-sm z-10">
                        {profile.avatar_url ? (
                            <Image src={profile.avatar_url} alt={profile.username} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gray-50 flex items-center justify-center text-3xl font-bold text-gray-300">
                                {profile.username[0].toUpperCase()}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 w-full pt-2 md:pt-16">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2 tracking-tight">
                                    {profile.full_name || profile.username}
                                    <VerificationBadge badge={profile.verification_badge} size="md" />
                                </h1>
                                <p className="text-sm text-gray-500 font-medium">@{profile.username}</p>
                            </div>

                            {/* Actions Desktop */}
                            <div className="hidden md:flex items-center gap-3">
                                {!isLoggedIn && (
                                    <Link href="/login" className="bg-black text-white text-xs font-bold px-6 py-2.5 rounded-full hover:bg-gray-800 transition-colors uppercase tracking-widest">
                                        Entrar para Seguir
                                    </Link>
                                )}
                                {isLoggedIn && !isOwner && (
                                    <>
                                        <Link 
                                            href={`/messages/${profile.user_id}`} 
                                            className="border border-gray-200 text-gray-700 p-2.5 rounded-full hover:bg-gray-50 hover:border-brand-purple hover:text-brand-purple transition-all"
                                            title="Enviar Mensagem"
                                        >
                                            <MessageCircle size={18} />
                                        </Link>

                                        <button className="bg-black text-white text-xs font-bold px-6 py-2.5 rounded-full hover:bg-gray-800 transition-opacity uppercase tracking-widest">
                                            Seguir
                                        </button>
                                    </>
                                )}
                                {isOwner && (
                                    <Link href="/settings" className="border border-gray-200 text-gray-700 text-xs font-bold px-6 py-2.5 rounded-full hover:bg-gray-50 transition-colors uppercase tracking-widest">
                                        Editar Perfil
                                    </Link>
                                )}
                                <button className="p-2 text-gray-400 hover:text-black transition-colors"><Share2 size={18} /></button>
                            </div>
                        </div>

                        {profile.bio && (
                            <p className="text-sm text-gray-700 leading-relaxed max-w-2xl font-normal mb-4">
                                {profile.bio}
                            </p>
                        )}

                        <div className="flex items-center gap-6 text-xs text-gray-400 font-medium">
                             <div className="flex items-center gap-1.5">
                                <Calendar size={14} />
                                <span>Entrou em {new Date(profile.created_at).getFullYear()}</span>
                             </div>
                             <div className="flex gap-4 text-gray-900">
                                <span><b className="text-black">{profile.stats.followers}</b> seguidores</span>
                                <span><b className="text-black">{profile.stats.following}</b> seguindo</span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Actions */}
                <div className="md:hidden flex items-center gap-2 py-4 border-b border-gray-50">
                     {!isLoggedIn ? (
                        <Link href="/login" className="flex-1 bg-black text-white text-sm font-bold py-3 rounded-xl text-center">Entrar</Link>
                     ) : !isOwner ? (
                        <>
                            <Link href={`/messages/${profile.user_id}`} className="px-4 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50">
                                <MessageCircle size={20} />
                            </Link>
                            <button className="flex-1 bg-black text-white text-sm font-bold py-3 rounded-xl">Seguir</button>
                        </>
                     ) : (
                        <Link href="/settings" className="flex-1 border border-gray-200 text-sm font-bold py-3 rounded-xl text-center">Editar Perfil</Link>
                     )}
                </div>
            </div>
        </div>

        {/* Placeholder Content */}
        <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
            <div className="py-20 text-center border border-dashed border-gray-100 rounded-3xl bg-gray-50/30">
                <BookOpen className="text-gray-200 mx-auto mb-4" size={32} />
                <p className="text-sm text-gray-400 font-bold">Nenhuma atividade pública.</p>
            </div>
        </div>
    </>
  );
}