import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { Shell } from "@/components/layout/Shell";
import { PostCard, PostWithDetails } from "@/components/feed/PostCard";
import { syncUserProfile } from "@/services/auth-sync";
import { TrendingUp, BookOpen, Sparkles } from "lucide-react";

export default async function Dashboard() {
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
  if (!user) redirect("/login");

  await syncUserProfile(user, hubSupabase, storiesSupabase);

  const { data: profile } = await hubSupabase
    .from("profiles")
    .select("nickname, full_name, avatar_url")
    .eq("user_id", user.id)
    .single();

  const displayName = profile?.full_name?.split(" ")[0] || "Leitor";
  const username = profile?.nickname || "me";

  const { data: rawPosts } = await storiesSupabase
    .from("posts")
    .select(`
        *,
        profiles (nickname, full_name, avatar_url, verification_badge),
        likes (user_id),
        comments (count)
    `)
    .order("priority_level", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

  // Conversão de tipo segura
  const posts = (rawPosts || []) as unknown as PostWithDetails[];

  return (
    <Shell user={user}>
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 p-6 lg:p-12">
        
        <div className="lg:col-span-8 min-h-screen">
          <header className="mb-12">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
              Olá, <span className="text-transparent bg-clip-text bg-brand-gradient">{displayName}</span>.
            </h1>
            <p className="text-gray-500 text-sm">Suas histórias e conexões.</p>
          </header>

          <div className="space-y-4">
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  currentUserId={user.id}
                  currentUserAvatar={profile?.avatar_url}
                />
              ))
            ) : (
              <div className="py-24 text-center">
                 <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="text-gray-300" size={20} />
                 </div>
                 <p className="text-gray-400 text-sm mb-4">Tudo quieto por aqui.</p>
                 <Link href="/post-oficial" className="text-xs font-bold text-brand-purple hover:underline">
                    (Postar como Oficial)
                 </Link>
              </div>
            )}
          </div>
        </div>

        <aside className="hidden lg:block lg:col-span-4 h-screen sticky top-0 py-12 pl-12 border-l border-gray-100">
             <div className="flex items-center gap-4 mb-12 group cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 overflow-hidden relative">
                    {profile?.avatar_url ? (
                        <Image src={profile.avatar_url} alt="Me" fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full bg-white flex items-center justify-center text-xs font-bold text-black">
                            {username?.[0]?.toUpperCase()}
                        </div>
                    )}
                </div>
                <div>
                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand-purple transition-colors">
                        {displayName}
                    </h4>
                    <Link href={`/u/${username}`} className="text-xs text-gray-400 hover:underline">
                        @{username}
                    </Link>
                </div>
             </div>

             <div className="mb-10">
                <h3 className="font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                   <TrendingUp size={12}/> Destaques
                </h3>
                <div className="space-y-4">
                   <div className="text-sm font-medium text-gray-800 border-l-2 border-brand-purple pl-3 py-1 cursor-pointer hover:bg-gray-50 transition-colors">
                      Início da Temporada de Leitura 2025
                   </div>
                </div>
             </div>
             
             <div>
                <h3 className="font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                   <BookOpen size={12}/> Meta
                </h3>
                <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-xl font-bold text-black">0</span>
                    <span className="text-xs text-gray-400">/ 12</span>
                </div>
                <div className="w-full bg-gray-50 h-1 rounded-full">
                    <div className="bg-black h-full w-[0%] rounded-full" />
                </div>
             </div>
        </aside>

      </div>
    </Shell>
  );
}