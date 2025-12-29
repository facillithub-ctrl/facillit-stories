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
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  console.log(`[PROFILE_PAGE] Renderizando página para: ${username}`);

  const profile = await getProfileByUsername(username);

  if (!profile) {
      console.log(`[PROFILE_PAGE] 404 - Perfil não retornado pelo serviço.`);
      notFound();
  }

  console.log(`[PROFILE_PAGE] ID do Perfil para Chat:`, profile.user_id);

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_HUB_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_HUB_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const isLoggedIn = !!currentUser;
  const isOwner = currentUser?.id === profile.user_id;

  return (
    <div className="min-h-screen bg-white w-full">
        {/* Capa */}
        <div className="relative h-64 md:h-80 w-full bg-gray-100 group overflow-hidden">
            {profile.cover_url ? (
                <Image src={profile.cover_url} alt="Capa" fill className="object-cover" priority />
            ) : (
                <div className="w-full h-full bg-gradient-to-r from-gray-50 to-gray-100" />
            )}
            {isOwner && (
                <button className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md text-xs font-bold px-5 py-2.5 rounded-full hover:bg-white transition-all flex items-center gap-2 shadow-sm z-10 text-gray-900">
                    <Edit3 size={14} /> Editar tema
                </button>
            )}
        </div>

        <div className="w-full max-w-[1400px] mx-auto px-6 md:px-10">
            <div className="relative -mt-20 flex flex-col md:flex-row items-end md:items-start gap-8 pb-8 border-b border-gray-50">
                
                {/* Avatar */}
                <div className="relative w-40 h-40 rounded-full ring-4 ring-white bg-white overflow-hidden shrink-0 shadow-lg z-10">
                    {profile.avatar_url ? (
                        <Image src={profile.avatar_url} alt={profile.username} fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gray-50 flex items-center justify-center text-4xl font-bold text-gray-300">
                            {profile.username[0].toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Info & Actions */}
                <div className="flex-1 w-full pt-4 md:pt-24">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2 tracking-tight">
                                {profile.full_name || profile.username}
                                <VerificationBadge badge={profile.verification_badge} size="md" />
                            </h1>
                            <p className="text-base text-gray-500 font-medium">@{profile.username}</p>
                        </div>

                        <div className="flex items-center gap-3">
                            {!isLoggedIn ? (
                                <Link href="/login" className="bg-black text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-gray-900 transition-colors">
                                    Entrar
                                </Link>
                            ) : !isOwner ? (
                                <>
                                    {/* Link com Log visual se estiver undefined */}
                                    <Link 
                                        href={`/messages/${profile.user_id}`} 
                                        className="group p-3 rounded-full border border-gray-200 text-gray-600 hover:text-[#42047e] hover:border-[#42047e] transition-all"
                                        title={`Enviar Mensagem (ID: ${profile.user_id})`}
                                    >
                                        <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
                                    </Link>

                                    <button className="bg-black text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-gray-800 transition-all shadow-lg shadow-gray-200">
                                        Seguir
                                    </button>
                                </>
                            ) : (
                                <Link href="/settings" className="border border-gray-200 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-gray-50 transition-colors">
                                    Editar Perfil
                                </Link>
                            )}
                            <button className="p-3 text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-50">
                                <Share2 size={20} />
                            </button>
                        </div>
                    </div>

                    {profile.bio && (
                        <p className="text-base text-gray-700 leading-relaxed max-w-3xl font-normal mb-6">
                            {profile.bio}
                        </p>
                    )}

                    <div className="flex items-center gap-8 text-sm text-gray-500 font-medium">
                            <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span>Desde {new Date(profile.created_at).getFullYear()}</span>
                            </div>
                            <div className="flex gap-6 text-gray-900">
                            <span><b className="text-black font-black">{profile.stats.followers}</b> seguidores</span>
                            <span><b className="text-black font-black">{profile.stats.following}</b> seguindo</span>
                            </div>
                    </div>
                </div>
            </div>

            <div className="w-full py-16">
                <div className="py-24 text-center border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/30">
                    <BookOpen className="text-gray-300 mx-auto mb-4" size={40} />
                    <p className="text-base text-gray-400 font-bold">Nenhuma atividade pública recente.</p>
                </div>
            </div>
        </div>
    </div>
  );
}