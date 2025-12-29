import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageCircle, AtSign, Bell } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

// Tipagem de Notificação
interface Notification {
  id: string;
  type: 'like_post' | 'like_comment' | 'reply_comment' | 'mention';
  created_at: string;
  read: boolean;
  actor: {
    nickname: string;
    avatar_url: string | null;
  };
  resource_id: string; // ID do post
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

  // Buscar Notificações (Join com Actor)
  const { data: rawNotifications } = await supabase
    .from("notifications")
    .select(`
      id, type, created_at, read, resource_id,
      actor:actor_id (nickname, avatar_url)
    `)
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Cast seguro
  const notifications = rawNotifications as unknown as Notification[];

  // Marcar como lidas (Efeito colateral seguro em Server Component)
  if (notifications?.some(n => !n.read)) {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("recipient_id", user.id)
        .eq("read", false);
  }

  // Ícones por tipo
  const getIcon = (type: string) => {
      switch(type) {
          case 'like_post':
          case 'like_comment': return <Heart className="fill-red-500 text-red-500" size={16} />;
          case 'reply_comment': return <MessageCircle className="fill-blue-500 text-blue-500" size={16} />;
          case 'mention': return <AtSign className="text-brand-purple" size={16} />;
          default: return <Bell size={16} />;
      }
  };

  const getMessage = (type: string) => {
      switch(type) {
          case 'like_post': return "curtiu sua publicação";
          case 'like_comment': return "curtiu seu comentário";
          case 'reply_comment': return "respondeu seu comentário";
          case 'mention': return "mencionou você";
          default: return "interagiu com você";
      }
  };

  return (
    <Shell user={user}>
      <div className="max-w-2xl mx-auto py-10 px-6">
        <header className="mb-8 flex items-center gap-3">
            <Bell size={24} className="text-brand-purple" />
            <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
        </header>

        <div className="space-y-2">
            {notifications && notifications.length > 0 ? (
                notifications.map((notif) => (
                    <div 
                        key={notif.id} 
                        className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${notif.read ? 'bg-white hover:bg-gray-50' : 'bg-brand-purple/5 hover:bg-brand-purple/10'}`}
                    >
                        {/* Ícone de Tipo */}
                        <div className="shrink-0 p-2 bg-white rounded-full shadow-sm border border-gray-100">
                            {getIcon(notif.type)}
                        </div>

                        {/* Avatar do Ator */}
                        <Link href={`/u/${notif.actor?.nickname}`} className="shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden relative border border-gray-100">
                                {notif.actor?.avatar_url ? (
                                    <Image src={notif.actor.avatar_url} alt="User" fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-bold text-gray-400">
                                        {notif.actor?.nickname?.[0].toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </Link>

                        {/* Texto */}
                        <div className="flex-1">
                            <p className="text-sm text-gray-900">
                                <span className="font-bold">{notif.actor?.nickname}</span> {getMessage(notif.type)}.
                            </p>
                            <span className="text-xs text-gray-400 font-medium">
                                {formatRelativeTime(notif.created_at)}
                            </span>
                        </div>

                        {/* Preview (Opcional - Imagem do post) */}
                        {/* <div className="w-10 h-10 bg-gray-100 rounded-md border border-gray-200" /> */}
                    </div>
                ))
            ) : (
                <div className="text-center py-20 text-gray-400">
                    <p>Nenhuma notificação ainda.</p>
                </div>
            )}
        </div>
      </div>
    </Shell>
  );
}