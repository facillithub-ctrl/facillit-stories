import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { PostCard, PostWithDetails } from "@/components/feed/PostCard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { syncUserProfile } from "@/services/auth-sync";
import Image from "next/image";
import { formatRelativeTime } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SinglePostPage({ params }: PageProps) {
  const { id } = await params;
  const cookieStore = await cookies();

  const hubSupabase = createServerClient(process.env.NEXT_PUBLIC_HUB_SUPABASE_URL!, process.env.NEXT_PUBLIC_HUB_ANON_KEY!, { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } });
  const storiesSupabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } });

  const { data: { user } } = await hubSupabase.auth.getUser();
  if (user) await syncUserProfile(user, hubSupabase, storiesSupabase);

  const { data: post, error } = await storiesSupabase
    .from("posts")
    .select(`*, profiles (nickname, full_name, avatar_url, verification_badge), likes (user_id), comments (count)`)
    .eq("id", id)
    .single();

  if (error || !post) return notFound();

  // Buscar Comentários para exibir na página
  const { data: comments } = await storiesSupabase
    .from("comments")
    .select(`*, profiles(nickname, avatar_url), comment_likes(user_id)`)
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  let currentUserAvatar = null;
  if (user) {
      const { data: profile } = await hubSupabase.from("profiles").select("avatar_url").eq("user_id", user.id).single();
      currentUserAvatar = profile?.avatar_url;
  }

  return (
    <Shell user={user}>
      <div className="max-w-3xl mx-auto py-8 px-4 lg:px-0 min-h-screen">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#42047e] mb-8 transition-colors">
            <ArrowLeft size={18} /> Voltar
        </Link>

        {/* Post Expandido */}
        <div className="mb-10">
            <PostCard 
                post={post as unknown as PostWithDetails}
                currentUserId={user?.id || ""}
                currentUserAvatar={currentUserAvatar}
                isExpanded={true}
            />
        </div>

        {/* Lista de Comentários Inline */}
        <div className="border-t border-gray-100 pt-8">
            <h3 className="text-base font-bold text-gray-900 mb-6">Comentários</h3>
            <div className="space-y-6">
                {comments && comments.length > 0 ? comments.map((c: any) => (
                    <div key={c.id} className="flex gap-4 group">
                        <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-100">
                            {c.profiles?.avatar_url ? (
                                <Image src={c.profiles.avatar_url} alt="User" fill className="object-cover"/>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400">{c.profiles?.nickname?.[0]}</div>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="font-bold text-sm text-gray-900">{c.profiles?.nickname}</span>
                                <span className="text-xs text-gray-400">{formatRelativeTime(c.created_at)}</span>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{c.content}</p>
                        </div>
                    </div>
                )) : (
                    <p className="text-gray-400 text-sm">Seja o primeiro a comentar.</p>
                )}
            </div>
        </div>
      </div>
    </Shell>
  );
}