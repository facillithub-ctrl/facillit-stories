import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { PostCard, PostWithDetails } from "@/components/feed/PostCard";
import { CreatePostButton } from "@/components/feed/CreatePostButton";
import { syncUserProfile } from "@/services/auth-sync";
import { 
    TrendingUp, 
    BookOpen, 
    Sparkles, 
    Search,
    Compass,
    Users
} from "lucide-react";

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

  const posts = (rawPosts || []) as unknown as PostWithDetails[];

  return (
    <Shell user={user}>
      {/* Container Responsivo: Padding reduzido no mobile (p-4) e maior no desktop (p-10) */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 p-4 lg:p-10 pb-20">
        
        {/* --- FEED --- */}
        <div className="lg:col-span-8 min-h-screen">
          
          {/* Header Mobile: Busca e Criar alinhados */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type="text" 
                    placeholder="Buscar..." 
                    className="w-full bg-white border border-gray-100 sm:bg-gray-50 sm:border-transparent rounded-full py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-brand-purple/20 transition-all shadow-sm sm:shadow-none"
                  />
              </div>
              
              {/* Botão de Criar flutuante no mobile ou fixo no header */}
              <div className="hidden sm:block">
                 <CreatePostButton />
              </div>
          </div>

          {/* Navegação Horizontal (Scrollável no Mobile) */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              <NavTab active>Para Você</NavTab>
              <NavTab href="/seguindo">Seguindo</NavTab>
              <NavTab href="/comunidade" icon={<Users size={14}/>}>Comunidade</NavTab>
              <NavTab href="/explorar" icon={<Compass size={14}/>}>Explorar</NavTab>
          </div>

          {/* Lista de Posts */}
          <div className="space-y-6">
            {posts.length > 0 ? (
              posts.map((post) => (
                <div key={post.id} className="relative">
                   {/* Deep Link (Área clicável que não interfere nos botões) */}
                   <Link href={`/post/${post.id}`} className="absolute inset-0 z-0 block" aria-label="Ver detalhes" />
                   
                   <div className="relative z-10 pointer-events-none">
                       <div className="pointer-events-auto">
                           <PostCard 
                              post={post} 
                              currentUserId={user.id}
                              currentUserAvatar={profile?.avatar_url}
                           />
                       </div>
                   </div>
                </div>
              ))
            ) : (
              <EmptyState />
            )}
          </div>
        </div>

        {/* --- SIDEBAR DIREITA (Desktop Only) --- */}
        <aside className="hidden lg:block lg:col-span-4 h-screen sticky top-0 py-4 pl-4">
             <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden relative border border-gray-100">
                        {profile?.avatar_url ? (
                            <Image src={profile.avatar_url} alt="Me" fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-gray-400">{username[0]?.toUpperCase()}</div>
                        )}
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900">{displayName}</h4>
                        <span className="text-xs text-gray-500">@{username}</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-gray-50 rounded-lg p-2">
                        <span className="block font-bold text-lg">0</span>
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Lidos</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                        <span className="block font-bold text-lg">0</span>
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Seguindo</span>
                    </div>
                </div>
             </div>

             <div className="bg-gradient-to-br from-gray-900 to-black text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
                <Sparkles className="absolute top-4 right-4 opacity-20" size={40} />
                <h3 className="font-bold text-sm uppercase tracking-widest text-gray-400 mb-2">Meta 2025</h3>
                <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-4xl font-bold">0</span>
                    <span className="text-sm text-gray-400">/ 12 livros</span>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden mb-4">
                    <div className="bg-brand-purple h-full w-[2%]" />
                </div>
             </div>
        </aside>

        {/* FAB (Floating Action Button) para Mobile */}
        <div className="lg:hidden fixed bottom-6 right-6 z-50">
            <CreatePostButton />
        </div>

      </div>
    </Shell>
  );
}

// Subcomponente de Aba
function NavTab({ children, active, icon, href }: { children: React.ReactNode, active?: boolean, icon?: React.ReactNode, href?: string }) {
    const className = `flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-full transition-all whitespace-nowrap ${
        active 
        ? "bg-black text-white shadow-md" 
        : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
    }`;

    if (href) return <Link href={href} className={className}>{icon}{children}</Link>;
    return <button className={className}>{icon}{children}</button>;
}

function EmptyState() {
    return (
        <div className="py-20 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200 mx-2 sm:mx-0">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-gray-300">
                <Sparkles size={24} />
            </div>
            <h3 className="text-gray-900 font-bold mb-1">Feed vazio</h3>
            <p className="text-gray-400 text-sm">Seja o primeiro a publicar algo hoje.</p>
        </div>
    )
}