import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

// Components
import { Shell } from "@/components/layout/Shell";
import { PostCard, PostWithDetails } from "@/components/feed/PostCard";
import { CreatePostButton } from "@/components/feed/CreatePostButton";

// Services & Utils
import { syncUserProfile } from "@/services/auth-sync";
import { Profile } from "@/types/db";

// Icons
import { 
    TrendingUp, 
    BookOpen, 
    Feather,
    Search
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

  // 2. Autenticação
  const { data: { user } } = await hubSupabase.auth.getUser();
  if (!user) redirect("/login");

  await syncUserProfile(user, hubSupabase, storiesSupabase);

  // 3. Buscar Perfil
  const { data: rawProfile } = await hubSupabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const profile = rawProfile as Profile;
  
  const displayName = profile?.full_name || profile?.nickname || user.email?.split('@')[0] || "Usuário";
  const username = profile?.nickname || "user";
  const avatarUrl = profile?.avatar_url;

  // 4. Buscar Posts
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

  // 5. Contagem
  const { count: postsCount } = await storiesSupabase
    .from("posts")
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  return (
    <Shell user={user}>
      <div className="w-full max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-16 pb-24 px-0 lg:px-6">
        
        {/* COLUNA PRINCIPAL (FEED) */}
        <div className="lg:col-span-8 w-full min-h-screen pt-8">
          
          {/* CABEÇALHO (Estático - Sem Sticky para não sobrepor nada) */}
          <header className="mb-2 px-4 lg:px-0 relative z-0">
             
             {/* Saudação + Botão Criar */}
             <div className="flex justify-between items-start mb-6">
                <div>
                   <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
                      Olá, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#42047e] to-[#07f49e]">{displayName}</span>.
                   </h1>
                   <p className="text-gray-400 text-sm mt-1 font-medium">O que vamos ler hoje?</p>
                </div>
                {/* Botão visível apenas em telas grandes */}
                <div className="hidden lg:block">
                   <CreatePostButton />
                </div>
             </div>

             {/* Barra de Busca */}
             <div className="relative group mb-8">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 pl-4 pointer-events-none">
                    <Search className="text-gray-300 h-5 w-5 group-focus-within:text-[#42047e] transition-colors" />
                </div>
                <input 
                  type="text" 
                  placeholder="Pesquisar autores, histórias ou tags..." 
                  className="w-full bg-gray-50 hover:bg-white focus:bg-white border border-transparent hover:border-gray-200 focus:border-[#42047e]/30 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none transition-all placeholder-gray-400 shadow-sm focus:shadow-md"
                />
             </div>

             {/* ABAS (REMOVEU-SE O STICKY - AGORA ELAS NÃO SOBREPÕEM) */}
             <div className="border-b border-gray-100 flex items-center gap-6 overflow-x-auto scrollbar-hide pt-2 bg-transparent relative z-0">
                <NavTab active>Para Você</NavTab>
                <NavTab>Seguindo</NavTab>
                <NavTab>Literatura</NavTab>
                <NavTab>Tecnologia</NavTab>
             </div>
          </header>

          {/* LISTA DE POSTS */}
          <div className="flex flex-col relative z-0">
            {posts.length > 0 ? (
              posts.map((post) => (
                <div key={post.id} className="relative border-b border-gray-50 hover:bg-gray-50/40 transition-colors py-6 lg:py-8 first:pt-6 group">
                   
                   {/* Deep Link */}
                   <Link 
                        href={`/post/${post.id}`} 
                        className="absolute inset-0 z-0 focus:outline-none" 
                        aria-label={`Ler post de ${post.profiles?.nickname}`}
                   />
                   
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
              <div className="py-24 text-center border-t border-dashed border-gray-100 mt-8">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Feather className="text-gray-300" size={24} />
                  </div>
                  <h3 className="text-gray-900 font-bold mb-1">Tudo calmo por aqui</h3>
                  <p className="text-gray-400 text-sm max-w-xs mx-auto">
                      Parece que ainda não há histórias neste feed.
                  </p>
                  <div className="mt-6 inline-block lg:hidden">
                    <CreatePostButton />
                  </div>
              </div>
            )}
          </div>
        </div>

        {/* WIDGETS LATERAL */}
        <aside className="hidden lg:block lg:col-span-4 h-screen sticky top-0 py-8 pl-8 space-y-10 overflow-y-auto scrollbar-hide border-l border-gray-50/60">
             
             {/* Widget Perfil */}
             <div className="flex flex-col animate-in fade-in slide-in-from-right-4 duration-700">
                <div className="flex items-center gap-4 mb-4">
                    <Link href={`/u/${username}`} className="w-14 h-14 rounded-full bg-gray-50 relative overflow-hidden border border-gray-100 hover:border-[#42047e]/30 transition-colors shrink-0">
                         {avatarUrl ? (
                             <Image src={avatarUrl} alt={displayName} fill className="object-cover" />
                         ) : (
                             <div className="w-full h-full flex items-center justify-center font-bold text-lg text-gray-300 bg-gray-50">
                                 {username[0]?.toUpperCase()}
                             </div>
                         )}
                    </Link>
                    <div className="overflow-hidden">
                        <Link href={`/u/${username}`} className="text-base font-bold text-gray-900 leading-tight hover:underline decoration-[#42047e]/30 underline-offset-4 truncate block">
                            {displayName}
                        </Link>
                        <p className="text-xs text-gray-400 truncate">@{username}</p>
                    </div>
                </div>

                <div className="flex gap-8 text-sm border-t border-gray-50 pt-4">
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-lg">{postsCount || 0}</span>
                        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">posts</span>
                    </div>
                </div>
             </div>

             {/* Tópicos */}
             <div>
                 <h3 className="font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                     <TrendingUp size={12}/> Em Alta
                 </h3>
                 <div className="space-y-4">
                     {['#FicçãoCientífica', 'Clube do Livro SP', 'Novo Stephen King'].map((tag, i) => (
                         <div key={i} className="flex justify-between items-center group cursor-pointer p-2 -mx-2 hover:bg-gray-50 rounded-lg transition-colors">
                             <span className="text-sm font-medium text-gray-600 group-hover:text-[#42047e] transition-colors">{tag}</span>
                         </div>
                     ))}
                 </div>
             </div>

             {/* Meta */}
             <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 shadow-sm">
                 <h3 className="font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                     <BookOpen size={12}/> Meta de Leitura
                 </h3>
                 <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mb-3">
                     <div className="bg-gradient-to-r from-[#42047e] to-[#07f49e] h-full w-[5%]" />
                 </div>
                 <div className="flex justify-between text-xs font-medium">
                     <span className="text-gray-900">0 lidos</span>
                     <span className="text-gray-400">Meta: 12</span>
                 </div>
             </div>
        </aside>

        {/* Mobile FAB */}
        <div className="lg:hidden fixed bottom-24 right-4 z-50">
             <div className="shadow-2xl shadow-[#42047e]/30 rounded-full scale-110 bg-white">
                 <CreatePostButton />
             </div>
        </div>
      </div>
    </Shell>
  );
}

function NavTab({ children, active }: { children: React.ReactNode, active?: boolean }) {
    return (
        <button className={`
            pb-4 text-sm font-medium transition-all relative shrink-0 outline-none
            ${active ? "text-[#42047e] font-bold" : "text-gray-500 hover:text-gray-800"}
        `}>
            {children}
            {active && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#42047e]" />
            )}
        </button>
    );
}