import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { PostCard, PostWithDetails } from "@/components/feed/PostCard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { syncUserProfile } from "@/services/auth-sync";

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
  if (user) {
    await syncUserProfile(user, hubSupabase, storiesSupabase);
  }

  // Buscar o Post Único
  const { data: post, error } = await storiesSupabase
    .from("posts")
    .select(`
        *,
        profiles (nickname, full_name, avatar_url, verification_badge),
        likes (user_id),
        comments (count)
    `)
    .eq("id", id)
    .single();

  if (error || !post) {
    return notFound();
  }

  // Dados do usuário logado (para interações)
  let currentUserAvatar = null;
  if (user) {
      const { data: profile } = await hubSupabase
          .from("profiles")
          .select("avatar_url")
          .eq("user_id", user.id)
          .single();
      currentUserAvatar = profile?.avatar_url;
  }

  return (
    <Shell user={user}>
      <div className="max-w-3xl mx-auto py-8 px-4 lg:px-0">
        
        {/* Botão Voltar */}
        <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black mb-6 transition-colors"
        >
            <ArrowLeft size={18} /> Voltar para o Feed
        </Link>

        {/* Post Expandido */}
        <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <PostCard 
                post={post as unknown as PostWithDetails}
                currentUserId={user?.id || ""}
                currentUserAvatar={currentUserAvatar}
            />
        </div>

      </div>
    </Shell>
  );
}