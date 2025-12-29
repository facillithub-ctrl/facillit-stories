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
    Users,
    Feather,
    Award
} from "lucide-react";

export default async function Dashboard() {
  const cookieStore = await cookies();
  
  // 1. Configurar Clientes
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

  // 3. Sincronizar e Buscar Perfil
  await syncUserProfile(user, hubSupabase, storiesSupabase);

  const { data: profile } = await hubSupabase
    .from("profiles")
    .select("nickname, full_name, avatar_url, bio")
    .eq("user_id", user.id)
    .single();

  const displayName = profile?.full_name?.split(" ")[0] || "Leitor";
  const username = profile?.nickname || "me";

  // 4. Buscar DADOS REAIS (Contadores)
  // Conta quantos posts o usuário tem
  const { count: postsCount } = await storiesSupabase
    .from("posts")
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // 5. Buscar Posts do Feed
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
      {/* Container Principal - Padding ajustado para Mobile não quebrar */}
      <div className="w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24 lg:px-6">
        
        {/* =========================================================================
            COLUNA ESQUERDA (FEED) - Ocupa tudo no mobile, 8 colunas no PC
           ========================================================================= */}
        <div className="lg:col-span-8 w-full min-h-screen">
          
          {/* Header Mobile & Desktop */}
          <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-50 lg:border-none lg:bg-transparent lg:static pt-4 pb-2 px-4 lg:px-0 mb-6 transition-all">
             <div className="flex flex-col gap-4">
                
                {/* Saudação (Escondida no mobile muito pequeno se rolar, mas visível por padrão) */}
                <div className="flex justify-between items-end">
                    <div>
                       <h1 className="text-2xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
                          Olá, <span className="text-brand-purple">{displayName}</span>.
                       </h1>
                       <p className="text-gray-500 text-sm lg:text-base mt-1 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
                          O que vamos ler hoje?
                       </p>
                    </div>
                    {/* Botão Criar Desktop */}
                    <div className="hidden lg:block">
                       <CreatePostButton />
                    </div>
                </div>

                {/* Barra de Busca + Filtros */}
                <div className="space-y-4 mt-2">
                    {/* Input Estilo Apple/Moderno */}
                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-purple transition-colors h-5 w-5" />
                        <input 
                          type="text" 
                          placeholder="Pesquisar no Facillit..." 
                          className="w-full bg-gray-50 hover:bg-gray-100 focus:bg-white border-none rounded-2xl py-4 pl-12 pr-4 text-base outline-none focus:ring-2 focus:ring-brand-purple/20 transition-all shadow-sm placeholder-gray-400"
                        />
                    </div>

                    {/* Navegação Horizontal (Pílulas) - Scroll corrigido */}
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
                        <NavPill active>Para Você</NavPill>
                        <NavPill>Seguindo</NavPill>
                        <NavPill icon={<BookOpen size={16}/>}>Clube</NavPill>
                        <NavPill icon={<Compass size={16}/>}>Explorar</NavPill>
                        <NavPill icon={<TrendingUp size={16}/>}>Em Alta</NavPill>
                    </div>
                </div>
             </div>
          </header>

          {/* Lista de Posts */}
          <div className="space-y-6 px-4 lg:px-0">
            {posts.length > 0 ? (
              posts.map((post) => (
                <div key={post.id} className="relative group">
                   {/* Card Flutuante com Sombras Suaves */}
                   <div className="bg-white rounded-[32px] p-1 shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-gray-100 hover:border-brand-purple/20 hover:shadow-lg transition-all duration-300">
                       <Link href={`/post/${post.id}`} className="absolute inset-0 z-0 rounded-[32px]" aria-label="Ver post" />
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
                </div>
              ))
            ) : (
              <EmptyState />
            )}
          </div>
        </div>


        {/* =========================================================================
            COLUNA LATERAL (WIDGETS) - Escondida no Mobile
           ========================================================================= */}
        <aside className="hidden lg:block lg:col-span-4 h-screen sticky top-0 py-8 pr-2 pl-4 space-y-8 overflow-y-auto scrollbar-hide">
             
             {/* WIDGET 1: Perfil Card (Estilo Passaporte) - DADOS REAIS */}
             <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] relative overflow-hidden text-center">
                {/* Background Decorativo */}
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-brand-purple/5 to-brand-green/5" />
                
                <div className="relative mt-4">
                    <div className="w-24 h-24 mx-auto p-1.5 bg-white rounded-full shadow-sm mb-4">
                        <div className="w-full h-full rounded-full bg-gray-100 relative overflow-hidden">
                             {profile?.avatar_url ? (
                                 <Image src={profile.avatar_url} alt="Eu" fill className="object-cover" />
                             ) : (
                                 <div className="w-full h-full flex items-center justify-center font-bold text-3xl text-gray-300">
                                     {username[0]?.toUpperCase()}
                                 </div>
                             )}
                        </div>
                    </div>
                    
                    <h2 className="text-xl font-bold text-gray-900">{profile?.full_name}</h2>
                    <p className="text-brand-purple font-medium text-sm mb-6">@{username}</p>
                    
                    {/* Estatísticas Reais */}
                    <div className="grid grid-cols-3 gap-2 border-t border-gray-50 pt-6">
                        <StatItem value={postsCount || 0} label="Posts" />
                        <StatItem value={0} label="Seguindo" /> {/* Placeholder até criar sistema de follow */}
                        <StatItem value={0} label="Fãs" />
                    </div>

                    <Link href={`/u/${username}`} className="mt-6 block w-full py-3 rounded-2xl bg-gray-900 text-white text-sm font-bold hover:bg-brand-purple transition-colors shadow-lg shadow-brand-purple/20">
                        Ver Meu Perfil
                    </Link>
                </div>
             </div>

             {/* WIDGET 2: Gamificação (Visual Premium) */}
             <div className="bg-gray-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-brand-purple/30 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                 
                 <div className="relative z-10">
                     <div className="flex items-center gap-2 mb-4 text-brand-green">
                         <Award size={20} />
                         <span className="text-xs font-bold uppercase tracking-widest">Nível 1</span>
                     </div>
                     
                     <h3 className="text-2xl font-bold mb-2">Leitor Iniciante</h3>
                     <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                         Você está a 3 livros de desbloquear o emblema "Devorador de Páginas".
                     </p>
                     
                     <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden mb-2">
                         <div className="bg-gradient-to-r from-brand-purple to-brand-green h-full w-[25%]" />
                     </div>
                     <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                        <span>Progresso</span>
                        <span>25%</span>
                     </div>
                 </div>
             </div>

             {/* WIDGET 3: Sugestões (Minimalista) */}
             <div className="bg-white rounded-[32px] border border-gray-100 p-6">
                 <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                     <Sparkles size={16} className="text-brand-purple"/> Para Inspirar
                 </h3>
                 <div className="space-y-4">
                     {['Clube de Ficção', 'Escrita Criativa', 'Poesia Moderna'].map((tag, i) => (
                         <div key={i} className="flex items-center justify-between group cursor-pointer p-2 hover:bg-gray-50 rounded-xl transition-colors">
                             <span className="font-bold text-gray-600 group-hover:text-brand-purple transition-colors">{tag}</span>
                             <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-white group-hover:shadow-sm transition-all">
                                 <Compass size={14} />
                             </div>
                         </div>
                     ))}
                 </div>
             </div>

             {/* Rodapé */}
             <div className="text-center px-4">
                <p className="text-xs text-gray-400">© 2025 Facillit. A casa das histórias.</p>
             </div>
        </aside>

        {/* --- BOTÃO FLUTUANTE (MOBILE ONLY) --- */}
        <div className="lg:hidden fixed bottom-24 right-5 z-50">
             <div className="shadow-2xl shadow-brand-purple/40 rounded-full animate-in zoom-in duration-300">
                 <CreatePostButton />
             </div>
        </div>

      </div>
    </Shell>
  );
}

// --- SUBCOMPONENTES ESTILIZADOS ---

function NavPill({ children, active, icon }: { children: React.ReactNode, active?: boolean, icon?: React.ReactNode }) {
    return (
        <button 
            className={`
                flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap snap-start border
                ${active 
                  ? "bg-gray-900 text-white border-gray-900 shadow-md scale-105" 
                  : "bg-white text-gray-500 border-gray-200 hover:border-brand-purple/30 hover:text-brand-purple hover:bg-gray-50"
                }
            `}
        >
            {icon}
            {children}
        </button>
    );
}

function StatItem({ label, value }: { label: string, value: number | string }) {
    return (
        <div className="flex flex-col items-center group cursor-pointer hover:bg-gray-50 rounded-xl p-2 transition-colors">
            <span className="text-lg font-bold text-gray-900 group-hover:text-brand-purple transition-colors">{value}</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">{label}</span>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="py-24 px-6 text-center rounded-[40px] bg-white border border-dashed border-gray-200 shadow-sm mx-auto max-w-lg mt-8">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Feather className="text-brand-purple opacity-50" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Página em branco</h3>
            <p className="text-gray-500 text-base mb-8 max-w-xs mx-auto leading-relaxed">
                O feed está quieto. Que tal compartilhar sua primeira história ou seguir novos autores?
            </p>
        </div>
    )
}