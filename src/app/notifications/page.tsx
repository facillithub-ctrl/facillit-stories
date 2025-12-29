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
  Zap 
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { markAllAsRead, clearAllNotifications } from "@/actions/notifications"; // Importe as actions criadas

// Tipagem Estrita
interface Notification {
  id: string;
  type: 'like_post' | 'like_comment' | 'reply_comment' | 'mention' | 'follow';
  created_at: string;
  read: boolean;
  actor: {
    nickname: string;
    avatar_url: string | null;
  };
  resource_id: string;
}

export default async function NotificationsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  const hubSupabase = createServerClient(
    process.env.NEXT_PUBLIC_HUB_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_HUB_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { user } } = await hubSupabase.auth.getUser();
  if (!user) redirect("/login");

  // Buscar Notificações
  const { data: rawNotifications } = await supabase
    .from("notifications")
    .select(`
      id, type, created_at, read, resource_id,
      actor:actor_id (nickname, avatar_url)
    `)
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const notifications = rawNotifications as unknown as Notification[];

  // Server Action wrappers para os botões (bind do ID)
  const handleMarkRead = async () => {
    "use server";
    await markAllAsRead(user.id);
  };

  const handleClearAll = async () => {
    "use server";
    await clearAllNotifications(user.id);
  };

  // Helpers de UI
  const getIcon = (type: string) => {
      switch(type) {
          case 'like_post':
          case 'like_comment': return <Heart className="fill-red-500 text-red-500" size={18} />;
          case 'reply_comment': return <MessageCircle className="fill-blue-500 text-blue-500" size={18} />;
          case 'mention': return <AtSign className="text-brand-purple" size={18} />;
          case 'follow': return <UserPlus className="text-green-500" size={18} />;
          default: return <Zap className="text-yellow-500" size={18} />;
      }
  };

  const getMessage = (type: string) => {
      switch(type) {
          case 'like_post': return "curtiu sua publicação";
          case 'like_comment': return "curtiu seu comentário";
          case 'reply_comment': return "respondeu seu comentário";
          case 'mention': return "mencionou você em uma conversa";
          case 'follow': return "começou a seguir você";
          default: return "interagiu com você";
      }
  };

  const getLink = (notif: Notification) => {
      if (notif.type === 'follow') return `/u/${notif.actor.nickname}`;
      return `/post/${notif.resource_id}`; // Deep Link para o post
  };

  return (
    <Shell user={user}>
      <div className="max-w-3xl mx-auto py-8 px-4 lg:px-0">
        
        {/* Header com Ações */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                    <Bell size={20} className="text-gray-900" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-none">Notificações</h1>
                    <p className="text-xs text-gray-500 mt-1">Todas as suas interações recentes.</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <form action={handleMarkRead}>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Marcar todas como lidas">
                        <CheckCheck size={14} /> <span className="hidden sm:inline">Lidas</span>
                    </button>
                </form>
                <form action={handleClearAll}>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Limpar tudo">
                        <Trash2 size={14} /> <span className="hidden sm:inline">Limpar</span>
                    </button>
                </form>
            </div>
        </div>

        {/* Lista */}
        <div className="space-y-1">
            {notifications && notifications.length > 0 ? (
                notifications.map((notif) => (
                    <Link 
                        key={notif.id} 
                        href={getLink(notif)}
                        className={`group flex items-start gap-4 p-4 rounded-xl transition-all relative overflow-hidden ${
                            notif.read ? 'bg-white hover:bg-gray-50' : 'bg-brand-purple/5 hover:bg-brand-purple/10 border-l-4 border-brand-purple'
                        }`}
                    >
                        {/* Indicador de Tipo */}
                        <div className="shrink-0 mt-1 p-2 bg-white rounded-full shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                            {getIcon(notif.type)}
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                {/* Avatar Mini */}
                                <div className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden relative border border-gray-100 shrink-0">
                                    {notif.actor?.avatar_url ? (
                                        <Image src={notif.actor.avatar_url} alt="User" fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-bold text-[8px] text-gray-500">
                                            {notif.actor?.nickname?.[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <span className="font-bold text-sm text-gray-900">{notif.actor?.nickname}</span>
                                <span className="text-gray-300 text-[10px]">•</span>
                                <span className="text-xs text-gray-400 font-medium">
                                    {formatRelativeTime(notif.created_at)}
                                </span>
                            </div>
                            
                            <p className="text-sm text-gray-600 leading-snug">
                                {getMessage(notif.type)}.
                            </p>
                        </div>

                        {/* Seta indicativa (hover) */}
                        <div className="opacity-0 group-hover:opacity-100 absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">
                            →
                        </div>
                    </Link>
                ))
            ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <Bell size={24} className="text-gray-300" />
                    </div>
                    <h3 className="text-gray-900 font-bold mb-1">Tudo limpo por aqui</h3>
                    <p className="text-gray-400 text-sm max-w-xs mx-auto">
                        Quando você interagir com a comunidade, suas notificações aparecerão aqui.
                    </p>
                </div>
            )}
        </div>
      </div>
    </Shell>
  );
}