
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
    Search,
    Compass,
    Feather,
    User
} from "lucide-react";

export default async function Dashboard() {
  const cookieStore = await cookies();
  
  // 1. Clientes Supabase
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

  // 2. Autenticação e Sync
  const { data: { user } } = await hubSupabase.auth.getUser();
  if (!user) redirect("/login");

  await syncUserProfile(user, hubSupabase, storiesSupabase);

  // 3. Buscar Perfil (HUB)
  const { data: profile } = await hubSupabase
    .from("profiles")
    .select("nickname, full_name, avatar_url, bio")
    .eq("user_id", user.id)
    .single();

  // Lógica de Nome: Garante que nunca fique vazio
  const displayName = profile?.full_name || profile?.nickname || user.email?.split('@')[0] || "Usuário";
  const username = profile?.nickname || "user";
  const avatarUrl = profile?.avatar_url;

  // 4. Buscar Posts do Feed
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

  // 5. Contagem de Posts (Stories)
  const { count: postsCount } = await storiesSupabase
    .from("posts")
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  return (
    <Shell user={user}>
      <div className="w-full max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-16 pb-24 px-0 lg:px-6">
        
        {/* =========================================================================
            COLUNA PRINCIPAL (FEED) 
           ========================================================================= */}
        <div className="lg:col-span-8 w-full min-h-screen pt-4 lg:pt-8">
          
          {/* Header Sticky (Com Gradiente da Marca no texto) */}
          <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md lg:static lg:bg-transparent px-4 lg:px-0 mb-4 transition-all border-b border-gray-50 lg:border-none py-2 lg:py-0">
             
             <div className="flex justify-between items-center mb-6 pt-2">
                <div>
                   <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
                      Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#42047e] to-[#07f49e]">{displayName}</span>.
                   </h1>
                   <p className="text-gray-400 text-sm mt-1">O que vamos escrever hoje?</p>
                </div>
                {/* Botão com Z-Index Alto */}
                <div className="hidden lg:block z-[999]">
                   <CreatePostButton />
                </div>
             </div>

             {/* Busca Limpa */}
             <div className="relative group mb-6">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300 h-5 w-5 ml-4 group-focus-within:text-[#42047e] transition-colors" />
                <input 
                  type="text" 
                  placeholder="Pesquisar histórias..." 
                  className="w-full bg-gray-50 hover:bg-gray-100 focus:bg-white border border-transparent focus:border-[#42047e]/20 rounded-full py-3 pl-12 pr-4 text-sm outline-none transition-all placeholder-gray-400"
                />
             </div>

             {/* Abas Sutis (Sem fundo) */}
             <div className="flex items-center gap-6 overflow-x-auto pb-0 scrollbar-hide border-b border-gray-100">
                <NavTab active>Para Você</NavTab>
                <NavTab>Seguindo</NavTab>
                <NavTab>Literatura</NavTab>
                <NavTab>Tecnologia</NavTab>
             </div>
          </header>

          {/* Feed (Sem Cards, Apenas Conteúdo) */}
          <div className="flex flex-col">
            {posts.length > 0 ? (
              posts.map((post) => (
                <div key={post.id} className="relative border-b border-gray-50 hover:bg-gray-50/30 transition-colors py-6 lg:py-8 first:pt-0">
                   {/* Deep Link: Cobre o card mas deixa botões clicáveis */}
                   <Link href={`/post/${post.id}`} className="absolute inset-0 z-0" aria-label="Ler post completo" />
                   
                   <div className="relative z-10 pointer-events-none px-4 lg:px-0">
                       <div className="pointer-events-auto">
                           <PostCard 
                              post={post} 
                              currentUserId={user.id}
                              currentUserAvatar={avatarUrl}
                           />
                       </div>
                   </div>
                </div>
              ))
            ) : (
              <div className="py-24 text-center">
                  <Feather className="mx-auto text-gray-200 mb-4" size={40} />
                  <p className="text-gray-400 text-sm">O feed está silencioso.</p>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            COLUNA LATERAL (WIDGETS CLEAN)
           ========================================================================= */}
        <aside className="hidden lg:block lg:col-span-4 h-screen sticky top-0 py-8 pl-4 space-y-10 overflow-y-auto scrollbar-hide border-l border-gray-50/50">
             
             {/* Widget Perfil (Sem bordas, apenas infos) */}
             <div className="flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-gray-50 relative overflow-hidden border border-gray-100">
                         {avatarUrl ? (
                             <Image src={avatarUrl} alt={displayName} fill className="object-cover" />
                         ) : (
                             <div className="w-full h-full flex items-center justify-center font-bold text-lg text-gray-300 bg-gray-50">
                                 {username[0]?.toUpperCase()}
                             </div>
                         )}
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-900 leading-tight">{displayName}</h2>
                        <Link href={`/u/${username}`} className="text-xs text-gray-400 hover:text-[#42047e] transition-colors">
                            @{username}
                        </Link>
                    </div>
                </div>

                <div className="flex gap-6 text-sm">
                    <div>
                        <span className="font-bold text-gray-900">{postsCount || 0}</span>
                        <span className="text-gray-400 ml-1">posts</span>
                    </div>
                    <div>
                        <span className="font-bold text-gray-900">0</span>
                        <span className="text-gray-400 ml-1">seguindo</span>
                    </div>
                </div>
             </div>

             {/* Tópicos */}
             <div>
                 <h3 className="font-bold text-xs uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                     <TrendingUp size={14}/> Em Alta
                 </h3>
                 <div className="space-y-4">
                     {['#FicçãoCientífica', 'Clube do Livro SP', 'Novo Stephen King'].map((tag, i) => (
                         <div key={i} className="flex justify-between items-center group cursor-pointer">
                             <span className="text-sm font-medium text-gray-600 group-hover:text-[#42047e] transition-colors">{tag}</span>
                         </div>
                     ))}
                 </div>
             </div>

             {/* Meta Visual */}
             <div>
                 <h3 className="font-bold text-xs uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                     <BookOpen size={14}/> Meta Anual
                 </h3>
                 <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-2">
                     <div className="bg-gradient-to-r from-[#42047e] to-[#07f49e] h-full w-[10%]" />
                 </div>
                 <div className="flex justify-between text-xs text-gray-400">
                     <span>0 livros</span>
                     <span>12 meta</span>
                 </div>
             </div>
        </aside>

        {/* Mobile FAB (Fundo Gradiente) */}
        <div className="lg:hidden fixed bottom-6 right-4 z-50">
             <div className="shadow-2xl shadow-[#42047e]/30 rounded-full">
                 <CreatePostButton />
             </div>
        </div>
      </div>
    </Shell>
  );
}

// Aba minimalista (apenas texto e borda inferior no hover/active)
function NavTab({ children, active }: { children: React.ReactNode, active?: boolean }) {
    return (
        <button className={`
            pb-3 text-sm font-medium transition-all relative
            ${active ? "text-gray-900 font-bold" : "text-gray-500 hover:text-gray-800"}
        `}>
            {children}
            {active && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#42047e] rounded-t-full" />}
        </button>
    );
}