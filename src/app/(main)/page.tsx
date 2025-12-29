import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Search, Feather } from "lucide-react";
import { cn } from "@/lib/utils";

import { PostCard, PostWithDetails } from "@/components/feed/PostCard";
import { CreatePostButton } from "@/components/feed/CreatePostButton";

import { syncUserProfile } from "@/services/auth-sync";
import { Profile } from "@/types/db";

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

  const { data: rawProfile } = await hubSupabase
    .from("profiles")
    .select("nickname, avatar_url")
    .eq("user_id", user.id)
    .single();

  const displayName = rawProfile?.nickname || "Leitor";
  const avatarUrl = rawProfile?.avatar_url;

  const { data: rawPosts } = await storiesSupabase
    .from("posts")
    .select(`*, profiles (nickname, full_name, avatar_url, verification_badge), likes (user_id), comments (count)`)
    .order("priority_level", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

  const posts = (rawPosts || []) as unknown as PostWithDetails[];

  return (
    // SEM SHELL AQUI - O Layout (main)/layout.tsx já cuida disso
    <div className="w-full max-w-3xl mx-auto pt-8 pb-32 px-4 sm:px-6">
          
        {/* Header Dashboard */}
        <header className="mb-8">
            <div className="flex justify-between items-end mb-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-green">{displayName}</span>.
                </h1>
                <p className="text-gray-400 text-sm mt-1 font-medium">Histórias selecionadas para você.</p>
            </div>
            <div className="hidden sm:block">
                <CreatePostButton />
            </div>
            </div>

            {/* Busca */}
            <div className="relative group mb-8">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 pl-4 pointer-events-none">
                <Search className="text-gray-300 h-4 w-4 group-focus-within:text-brand-purple transition-colors" />
            </div>
            <input 
                type="text" 
                placeholder="Pesquisar..." 
                className="w-full bg-gray-50 border-none rounded-2xl py-3 pl-10 pr-4 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-gray-100 transition-all placeholder-gray-400"
            />
            </div>

            {/* Abas */}
            <div className="flex items-center gap-6 border-b border-gray-50 pb-1 overflow-x-auto scrollbar-hide">
            <NavTab active>Descobrir</NavTab>
            <NavTab>Seguindo</NavTab>
            <NavTab>Clubes</NavTab>
            </div>
        </header>

        {/* Feed */}
        <div className="space-y-0">
        {posts.length > 0 ? (
            posts.map((post) => (
            <div key={post.id} className="relative border-b border-gray-50 last:border-none py-2">
                <PostCard 
                    post={post} 
                    currentUserId={user.id}
                    currentUserAvatar={avatarUrl}
                />
            </div>
            ))
        ) : (
            <div className="py-24 text-center">
                <Feather className="text-gray-200 mx-auto mb-3" size={32} />
                <p className="text-gray-400 text-sm font-medium">Ainda sem histórias.</p>
            </div>
        )}
        </div>

        {/* Mobile FAB */}
        <div className="lg:hidden fixed bottom-6 right-6 z-30">
            <div className="shadow-2xl shadow-brand-purple/30 rounded-full">
                <CreatePostButton />
            </div>
        </div>
    </div>
  );
}

function NavTab({ children, active }: { children: React.ReactNode, active?: boolean }) {
    return (
        <button className={cn(
            "pb-3 text-sm font-medium transition-all relative shrink-0 outline-none",
            active ? "text-gray-900 font-bold" : "text-gray-400 hover:text-gray-600"
        )}>
            {children}
            {active && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-brand-gradient rounded-t-full" />}
        </button>
    );
}