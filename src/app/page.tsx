import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Shell } from "@/components/layout/Shell";
import { PostCard, PostWithDetails } from "@/components/feed/PostCard";
import { CreatePostButton } from "@/components/feed/CreatePostButton"; // Novo componente
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

  // Busca Posts
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
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 lg:p-10">
        
        {/* --- COLUNA PRINCIPAL (FEED) --- */}
        <div className="lg:col-span-8 min-h-screen">
          
          {/* Top Bar: Busca e Criar */}
          <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-purple transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="Buscar histórias, pessoas ou tópicos..." 
                    className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-brand-purple/20 focus:ring-4 focus:ring-brand-purple/5 rounded-full py-3 pl-12 pr-4 outline-none transition-all placeholder-gray-400 text-sm font-medium"
                  />
              </div>
              <CreatePostButton />
          </div>

          {/* Abas de Navegação */}
          <div className="flex items-center gap-1 mb-8 border-b border-gray-100 pb-1 overflow-x-auto scrollbar-hide">
              <button className="px-4 py-2 text-sm font-bold text-gray-900 border-b-2 border-brand-purple whitespace-nowrap">
                  Para Você
              </button>
              <Link href="/seguindo" className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-t-lg transition-colors whitespace-nowrap">
                  Seguindo
              </Link>
              <Link href="/comunidade" className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-t-lg transition-colors whitespace-nowrap flex items-center gap-2">
                  <Users size={14}/> Comunidade
              </Link>
              <Link href="/explorar" className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-t-lg transition-colors whitespace-nowrap flex items-center gap-2">
                  <Compass size={14}/> Explorar
              </Link>
          </div>

          {/* Feed */}
          <div className="space-y-6">
            {posts.length > 0 ? (
              posts.map((post) => (
                // Envolvemos o Card em um Link para o Deep Link (clicável fora das áreas interativas)
                // Nota: O PostCard deve tratar eventos de clique internos com e.stopPropagation()
                // ou usamos apenas o título/área branca como link.
                // Para simplificar, o PostCard atual já tem links internos. 
                // Vamos manter como está, mas adicionar um botão "Expandir" ou título clicável dentro do card.
                <div key={post.id} className="relative">
                   {/* Overlay link para o post (Deep Link) - Posicionado para não cobrir botões */}
                   <Link href={`/post/${post.id}`} className="absolute inset-0 z-0" aria-label="Ver post completo" />
                   
                   <div className="relative z-10 pointer-events-none">
                       {/* Passamos pointer-events-auto dentro do componente para os botões funcionarem */}
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
              <div className="py-24 text-center border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                 <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Sparkles className="text-gray-300" size={24} />
                 </div>
                 <h3 className="text-gray-900 font-bold mb-1">Tudo quieto por aqui.</h3>
                 <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
                    Parece que ninguém publicou nada ainda. Que tal ser o primeiro?
                 </p>
              </div>
            )}
          </div>
        </div>

        {/* --- SIDEBAR DIREITA (WIDGETS) --- */}
        <aside className="hidden lg:block lg:col-span-4 h-screen sticky top-0 py-10 pl-8 border-l border-gray-100">
             
             {/* User Mini Profile */}
             <div className="flex items-center gap-3 mb-10 group cursor-pointer p-3 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 overflow-hidden relative">
                    {profile?.avatar_url ? (
                        <Image src={profile.avatar_url} alt="Me" fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full bg-white flex items-center justify-center text-sm font-bold text-black">
                            {username?.[0]?.toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-900 truncate group-hover:text-brand-purple transition-colors">
                        {displayName}
                    </h4>
                    <Link href={`/u/${username}`} className="text-xs text-gray-400 hover:text-gray-600 truncate block">
                        @{username}
                    </Link>
                </div>
             </div>

             {/* Trending */}
             <div className="mb-10">
                <h3 className="font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-5 flex items-center gap-2">
                   <TrendingUp size={12}/> Em Alta
                </h3>
                <div className="space-y-2">
                   {['Início da Temporada 2025', '#LeituraColetiva', 'Ficção Científica BR'].map((tag, i) => (
                       <div key={i} className="group cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors">
                          <span className="text-xs text-gray-400 block mb-0.5">Assunto do Momento</span>
                          <span className="text-sm font-bold text-gray-800 group-hover:text-brand-purple transition-colors">
                              {tag}
                          </span>
                       </div>
                   ))}
                </div>
             </div>
             
             {/* Meta de Leitura */}
             <div className="bg-black text-white p-5 rounded-2xl shadow-xl shadow-black/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <BookOpen size={80} />
                </div>
                <h3 className="font-bold text-xs uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-2">
                   Meta Anual
                </h3>
                <div className="flex items-end gap-2 mb-4">
                    <span className="text-3xl font-bold">0</span>
                    <span className="text-sm text-gray-400 mb-1">/ 12 livros</span>
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-brand-purple h-full w-[5%] rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                </div>
                <button className="mt-4 w-full py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors">
                    Atualizar Progresso
                </button>
             </div>
        </aside>

      </div>
    </Shell>
  );
}