import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import Image from "next/image";
import Link from "next/link";
import { 
  Heart, 
  MessageCircle, 
  AtSign, 
  Bell, 
  UserPlus, 
  Trash2, 
  CheckCheck,
  Zap,
  ArrowRight
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { markAllAsRead, clearAllNotifications } from "@/actions/notifications";

// Tipagem Estrita
interface Notification {
  id: string;
  type: 'like_post' | 'like_comment' | 'reply_comment' | 'mention' | 'follow';
  created_at: string;
  read: boolean;
  actor: {
    nickname: string;
    avatar_url: string | null;
  } | null; // Pode ser null se o usuário for deletado
  resource_id: string;
}

export default async function NotificationsPage() {
  const cookieStore = await cookies();
  
  // 1. Cliente HUB (Para Autenticação)
  const hubSupabase = createServerClient(
    process.env.NEXT_PUBLIC_HUB_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_HUB_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  // 2. Cliente STORIES (Backend Puro - Sem Cookies para evitar conflito RLS)
  const storiesBackend = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return undefined; } } }
  );

  // Validação de Segurança
  const { data: { user } } = await hubSupabase.auth.getUser();
  if (!user) redirect("/login");

  // Buscar Notificações (Usando cliente backend)
  const { data: rawNotifications } = await storiesBackend
    .from("notifications")
    .select(`
      id, type, created_at, read, resource_id,
      actor:actor_id (nickname, avatar_url)
    `)
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const notifications = (rawNotifications || []) as unknown as Notification[];

  // Actions
  const handleMarkRead = async () => {
    "use server";
    await markAllAsRead(user.id);
  };

  const handleClearAll = async () => {
    "use server";
    await clearAllNotifications(user.id);
  };

  // Helpers UI
  const getIcon = (type: string) => {
      switch(type) {
          case 'like_post': return <Heart className="fill-white text-white" size={14} />;
          case 'like_comment': return <Heart className="fill-white text-white" size={14} />;
          case 'reply_comment': return <MessageCircle className="fill-white text-white" size={14} />;
          case 'mention': return <AtSign className="text-white" size={14} />;
          case 'follow': return <UserPlus className="text-white" size={14} />;
          default: return <Zap className="text-white" size={14} />;
      }
  };

  const getBgColor = (type: string) => {
      switch(type) {
          case 'like_post': 
          case 'like_comment': return "bg-gradient-to-br from-red-500 to-pink-500";
          case 'reply_comment': return "bg-gradient-to-br from-blue-500 to-cyan-500";
          case 'mention': return "bg-gradient-to-br from-brand-purple to-indigo-600";
          default: return "bg-gray-400";
      }
  };

  const getMessage = (type: string) => {
      switch(type) {
          case 'like_post': return "curtiu sua publicação";
          case 'like_comment': return "amou seu comentário";
          case 'reply_comment': return "respondeu você";
          case 'mention': return "mencionou você";
          case 'follow': return "começou a seguir você";
          default: return "interagiu com você";
      }
  };

  return (
    <Shell user={user}>
      <div className="max-w-2xl mx-auto py-6 px-4 pb-24">
        
        {/* Header Premium */}
        <div className="flex items-end justify-between mb-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                   Notificações <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                   Fique por dentro do que acontece.
                </p>
            </div>

            <div className="flex gap-2">
                 <form action={handleMarkRead}>
                    <button title="Marcar lidas" className="p-2.5 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-brand-purple hover:border-brand-purple/30 transition-all shadow-sm">
                        <CheckCheck size={18} />
                    </button>
                 </form>
                 <form action={handleClearAll}>
                    <button title="Limpar tudo" className="p-2.5 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-200 transition-all shadow-sm">
                        <Trash2 size={18} />
                    </button>
                 </form>
            </div>
        </div>

        {/* Lista de Notificações */}
        <div className="space-y-3">
            {notifications.length > 0 ? (
                notifications.map((notif) => (
                    <Link 
                        key={notif.id} 
                        href={`/post/${notif.resource_id}`}
                        className={`group relative flex items-center gap-4 p-4 rounded-3xl transition-all duration-300 border ${
                            notif.read 
                             ? 'bg-white border-gray-50 hover:border-gray-100' 
                             : 'bg-white border-brand-purple/20 shadow-[0_4px_20px_rgba(124,58,237,0.05)]'
                        }`}
                    >
                        {!notif.read && (
                            <div className="absolute top-4 right-4 w-2 h-2 bg-brand-purple rounded-full" />
                        )}

                        {/* Avatar com Badge de Ícone */}
                        <div className="relative shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gray-100 p-0.5 border border-white shadow-sm overflow-hidden">
                                {notif.actor?.avatar_url ? (
                                    <Image src={notif.actor.avatar_url} alt="User" fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center font-bold text-gray-400 text-xs">
                                        {notif.actor?.nickname?.[0] || "?"}
                                    </div>
                                )}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${getBgColor(notif.type)}`}>
                                {getIcon(notif.type)}
                            </div>
                        </div>

                        {/* Texto */}
                        <div className="flex-1 min-w-0 py-1">
                            <div className="flex flex-wrap items-baseline gap-1.5 mb-0.5">
                                <span className="font-bold text-sm text-gray-900">
                                    {notif.actor?.nickname || "Alguém"}
                                </span>
                                <span className="text-xs text-gray-400 font-medium">
                                    {formatRelativeTime(notif.created_at)}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 leading-snug group-hover:text-gray-900 transition-colors">
                                {getMessage(notif.type)}
                            </p>
                        </div>

                        {/* Seta Hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300 text-gray-300">
                            <ArrowRight size={18} />
                        </div>
                    </Link>
                ))
            ) : (
                <div className="py-20 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-500">
                        <Bell size={32} className="text-gray-300" />
                    </div>
                    <h3 className="text-gray-900 font-bold">Nenhuma novidade</h3>
                    <p className="text-sm text-gray-400 mt-1">
                        Suas notificações aparecerão aqui.
                    </p>
                </div>
            )}
        </div>
      </div>
    </Shell>
  );
}