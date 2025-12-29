import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { PostCard, PostWithDetails } from "@/components/feed/PostCard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { syncUserProfile } from "@/services/auth-sync";
import Image from "next/image";
import { formatRelativeTime } from "@/lib/utils";
import { CommentWithProfile } from "@/types/db";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SinglePostPage({ params }: PageProps) {
  const { id } = await params;
  const cookieStore = await cookies();

  const hubSupabase = createServerClient(
    process.env.NEXT_PUBLIC_HUB_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_HUB_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );
  
  const storiesSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { user } } = await hubSupabase.auth.getUser();
  if (user) await syncUserProfile(user, hubSupabase, storiesSupabase);

  const { data: rawPost, error } = await storiesSupabase
    .from("posts")
    .select(`
      *, 
      profiles (nickname, full_name, avatar_url, verification_badge), 
      likes (user_id), 
      comments (count)
    `)
    .eq("id", id)
    .single();

  if (error || !rawPost) return notFound();

  const { data: rawComments } = await storiesSupabase
    .from("comments")
    .select(`*, profiles(nickname, avatar_url), comment_likes(user_id)`)
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  const post = rawPost as unknown as PostWithDetails;
  const comments = (rawComments || []) as unknown as CommentWithProfile[];

  let currentUserAvatar = null;
  if (user) {
      const { data: profile } = await hubSupabase.from("profiles").select("avatar_url").eq("user_id", user.id).single();
      currentUserAvatar = profile?.avatar_url;
  }

  return (
    // SEM SHELL - Conteúdo direto
    <div className="max-w-3xl mx-auto px-4 lg:px-0 min-h-screen pt-20 lg:pt-8 pb-24">
        
        {/* Botão Voltar */}
        <div className="mb-6">
            <Link 
                href="/" 
                className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#42047e] transition-colors group px-2 py-2 -ml-2 rounded-lg hover:bg-gray-50"
            >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
                Voltar para o feed
            </Link>
        </div>

        {/* Post */}
        <div className="mb-10">
            <PostCard 
                post={post}
                currentUserId={user?.id || ""}
                currentUserAvatar={currentUserAvatar}
                isExpanded={true}
            />
        </div>

        {/* Comentários */}
        <div className="border-t border-gray-100 pt-8">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                Comentários <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px]">{comments.length}</span>
            </h3>
            
            <div className="space-y-6">
                {comments.length > 0 ? comments.map((c) => (
                    <div key={c.id} className="flex gap-4 group">
                        <Link href={`/u/${c.profiles?.nickname}`} className="shrink-0">
                            <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden border border-gray-100 hover:border-[#42047e]/30 transition-colors">
                                {c.profiles?.avatar_url ? (
                                    <Image src={c.profiles.avatar_url} alt="User" width={32} height={32} className="object-cover w-full h-full"/>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400">
                                        {c.profiles?.nickname?.[0]}
                                    </div>
                                )}
                            </div>
                        </Link>
                        <div className="flex-1">
                            <div className="flex items-baseline gap-2 mb-1">
                                <Link href={`/u/${c.profiles?.nickname}`} className="font-bold text-sm text-gray-900 hover:text-[#42047e] transition-colors">
                                    {c.profiles?.nickname || "Usuário"}
                                </Link>
                                <span className="text-xs text-gray-400">{formatRelativeTime(c.created_at)}</span>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                        </div>
                    </div>
                )) : (
                    <div className="py-12 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-400 text-sm">Seja o primeiro a comentar.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
  );
}