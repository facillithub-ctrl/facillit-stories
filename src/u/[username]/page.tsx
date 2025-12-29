import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getProfileByUsername } from "@/services/profile";
import { Sidebar } from "@/components/layout/Sidebar";
import { Calendar, Link as LinkIcon, MapPin } from "lucide-react";

// Tipagem dos parâmetros da rota
interface ProfilePageProps {
  params: { username: string };
}

// Geração de Metadados para SEO e Compartilhamento (Twitter/WhatsApp)
export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const profile = await getProfileByUsername(params.username);
  
  if (!profile) return { title: "Perfil não encontrado" };

  return {
    title: `${profile.full_name || profile.username} | Facillit Stories`,
    description: profile.bio || `Confira o perfil de leitura de ${profile.username}.`,
    openGraph: {
      images: profile.avatar_url ? [profile.avatar_url] : [],
    },
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  // 1. Busca de dados Real (Sem Mocks)
  const profile = await getProfileByUsername(params.username);

  // 2. Se não existir, 404 (Next.js lida com isso)
  if (!profile) {
    notFound();
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      
      {/* Ajuste de margem para compensar sidebar fixa (lg:ml-20 ou lg:ml-64 dependendo do estado inicial, mas aqui deixamos fluido) */}
      <main className="flex-1 lg:ml-64 w-full">
        
        {/* Capa do Perfil */}
        <div className="h-48 md:h-64 bg-gray-100 relative w-full overflow-hidden">
            {profile.cover_url ? (
               <Image 
                 src={profile.cover_url} 
                 alt="Capa" 
                 fill 
                 className="object-cover"
                 priority
               />
            ) : (
               // Fallback: Gradiente da Marca se não tiver capa
               <div className="w-full h-full bg-brand-gradient opacity-90" />
            )}
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-12">
          
          {/* Header do Perfil (Avatar + Ações) */}
          <div className="relative -mt-16 sm:-mt-20 flex flex-col sm:flex-row items-end sm:items-end gap-4 mb-6">
            
            {/* Avatar */}
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-md bg-white overflow-hidden">
               {profile.avatar_url ? (
                 <Image 
                   src={profile.avatar_url} 
                   alt={profile.username} 
                   fill 
                   className="object-cover"
                 />
               ) : (
                 <div className="w-full h-full bg-gray-100 flex items-center justify-center text-3xl font-bold text-gray-300">
                    {profile.username[0].toUpperCase()}
                 </div>
               )}
            </div>

            {/* Ações (Botão Seguir) */}
            <div className="flex-1 w-full sm:w-auto flex justify-end pb-2">
               {/* TODO: Este botão precisará ser um Client Component para checar auth.
                  Por enquanto, deixamos visualmente pronto.
               */}
               <button className="px-6 py-2 bg-black text-white font-medium rounded-full hover:bg-gray-800 transition-all shadow-sm">
                 Seguir
               </button>
            </div>
          </div>

          {/* Informações Textuais */}
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-black flex items-center gap-2">
                {profile.full_name || profile.username}
                {/* Badge de Verificado (Exemplo futuro) */}
                {/* <BadgeCheck className="text-brand-green w-5 h-5" /> */}
              </h1>
              <p className="text-gray-500 font-medium">@{profile.username}</p>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-gray-800 leading-relaxed max-w-2xl whitespace-pre-wrap">
                {profile.bio}
              </p>
            )}

            {/* Metadados (Data, Location, Website) */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
               <div className="flex items-center gap-1">
                 <Calendar size={14} />
                 <span>Entrou em {new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
               </div>
               {/* Exemplo de dados futuros */}
               {/* <div className="flex items-center gap-1"><MapPin size={14} /> Brasil</div> */}
            </div>

            {/* Stats (Métricas de Leitura) */}
            <div className="flex gap-6 py-4 border-t border-b border-gray-100 mt-6">
               <div className="text-center sm:text-left">
                 <span className="block font-bold text-black text-lg">0</span>
                 <span className="text-gray-500 text-sm">Livros lidos</span>
               </div>
               <div className="text-center sm:text-left">
                 <span className="block font-bold text-black text-lg">0</span>
                 <span className="text-gray-500 text-sm">Seguidores</span>
               </div>
               <div className="text-center sm:text-left">
                 <span className="block font-bold text-black text-lg">0</span>
                 <span className="text-gray-500 text-sm">Seguindo</span>
               </div>
            </div>

          </div>
        </div>

        {/* Área de Conteúdo (Tabs) */}
        <div className="max-w-4xl mx-auto px-4">
           {/* Placeholder para Feed do Usuário */}
           <div className="flex items-center gap-8 border-b border-gray-200 mb-6">
              <button className="py-3 border-b-2 border-black font-semibold text-black">Atividades</button>
              <button className="py-3 border-b-2 border-transparent text-gray-500 hover:text-black transition-colors">Estantes</button>
              <button className="py-3 border-b-2 border-transparent text-gray-500 hover:text-black transition-colors">Resenhas</button>
           </div>
           
           <div className="p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <p className="text-gray-500">Nenhuma atividade recente de {profile.username}.</p>
           </div>
        </div>

      </main>
    </div>
  );
}