import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { syncUserProfile } from "@/services/auth-sync";
import { PostCard } from "@/components/feed/PostCard"; // Novo componente
import { Sparkles, BookOpen } from "lucide-react";
import Link from "next/link";

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

  // 2. Auth e Sync
  const { data: { user } } = await hubSupabase.auth.getUser();
  if (!user) redirect("/login");

  await syncUserProfile(user, hubSupabase, storiesSupabase);

  // 3. Dados do Usuário Logado (Para passar ao Modal de Comentários)
  const { data: profile } = await hubSupabase
    .from("profiles")
    .select("nickname, full_name, avatar_url")
    .eq("user_id", user.id)
    .single();

  const displayName = profile?.full_name?.split(" ")[0] || "Leitor";

  // 4. Buscar Posts com JOINS (Agora funciona com as FKs criadas no passo 1)
  const { data: posts } = await storiesSupabase
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

  return (
    <Shell user={user}>
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 p-6 lg:p-12">
        
        {/* FEED */}
        <div className="lg:col-span-8 min-h-screen">
          
          <header className="mb-12">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
              Olá, <span className="text-transparent bg-clip-text bg-brand-gradient">{displayName}</span>.
            </h1>
            <p className="text-gray-500 text-sm">Suas histórias e conexões.</p>
          </header>

          <div className="space-y-4">
            {posts && posts.length > 0 ? (
              posts.map((post: any) => (
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
                 <p className="text-gray-400 text-sm">Tudo quieto por aqui.</p>
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR RIGHT (Mantida Simples) */}
        <aside className="hidden lg:block lg:col-span-4 h-screen sticky top-0 py-12 pl-12 border-l border-gray-100">
             <div className="mb-10">
                <h3 className="font-bold text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                   Destaques da Comunidade
                </h3>
                <div className="space-y-4">
                   <div className="text-sm font-medium text-gray-800 border-l-2 border-brand-purple pl-3 py-1 cursor-pointer hover:bg-gray-50">
                      O retorno dos clubes de leitura presenciais.
                   </div>
                   <div className="text-sm font-medium text-gray-500 border-l-2 border-transparent pl-3 py-1 cursor-pointer hover:text-black">
                      Melhores lançamentos de Ficção Científica.
                   </div>
                </div>
             </div>
        </aside>

      </div>
    </Shell>
  );
}