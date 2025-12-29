"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import { Heart, MessageCircle, AtSign, Zap, Bell, UserPlus } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'likes' | 'comments'>('all');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchNotifs() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("notifications")
        .select(`*, actor:actor_id(nickname, avatar_url)`)
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      
      setNotifications(data || []);
      setLoading(false);
    }
    fetchNotifs();
  }, []);

  // Filtra no cliente para ser instantâneo (SPA feeling)
  const filtered = notifications.filter(n => {
    if (activeTab === 'likes') return n.type.includes('like');
    if (activeTab === 'comments') return n.type.includes('comment') || n.type === 'mention';
    return true;
  });

  const getIcon = (type: string) => {
    if (type.includes('like')) return <Heart className="text-red-500 fill-current" size={16} />;
    if (type.includes('comment') || type === 'mention') return <MessageCircle className="text-[#42047e] fill-current" size={16} />;
    if (type === 'follow') return <UserPlus className="text-[#07f49e]" size={16} />;
    return <Zap className="text-yellow-500 fill-current" size={16} />;
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 lg:px-0 pb-32">
       
       <div className="flex items-center gap-3 mb-8">
           <Bell className="text-[#42047e]" size={24} />
           <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
       </div>
       
       {/* Abas Estilizadas */}
       <div className="flex gap-2 mb-8 bg-gray-50 p-1 rounded-xl w-fit">
          {['all', 'likes', 'comments'].map(tab => (
             <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                    "px-4 py-1.5 text-xs font-bold rounded-lg transition-all capitalize",
                    activeTab === tab 
                        ? "bg-white text-gray-900 shadow-sm" 
                        : "text-gray-400 hover:text-gray-600"
                )}
             >
                {tab === 'all' ? 'Tudo' : tab === 'likes' ? 'Curtidas' : 'Respostas'}
             </button>
          ))}
       </div>

       {/* Lista */}
       <div className="space-y-2">
          {loading ? (
             <p className="text-center text-gray-400 text-sm py-12">Atualizando...</p>
          ) : filtered.length === 0 ? (
             <div className="text-center py-16 border border-dashed border-gray-100 rounded-2xl">
                 <p className="text-gray-400 text-sm">Nenhuma notificação nesta categoria.</p>
             </div>
          ) : (
             filtered.map(notif => (
                <Link 
                   href={`/post/${notif.resource_id}`} 
                   key={notif.id}
                   className={cn(
                       "flex items-start gap-4 p-4 rounded-2xl transition-all border border-transparent",
                       notif.read ? "bg-white hover:bg-gray-50" : "bg-white border-[#42047e]/10 shadow-[0_4px_20px_rgba(66,4,126,0.05)]"
                   )}
                >
                   <div className="relative shrink-0 pt-1">
                       <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-100">
                           {notif.actor?.avatar_url ? (
                               <Image src={notif.actor.avatar_url} alt="User" fill className="object-cover" />
                           ) : (
                               <div className="w-full h-full flex items-center justify-center font-bold text-xs text-gray-400">
                                   {notif.actor?.nickname?.[0].toUpperCase()}
                               </div>
                           )}
                       </div>
                       <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm border border-gray-50">
                           {getIcon(notif.type)}
                       </div>
                   </div>
                   <div className="flex-1">
                       <p className="text-sm text-gray-900 leading-snug">
                           <span className="font-bold">{notif.actor?.nickname}</span> {getMessage(notif.type)}
                       </p>
                       <p className="text-xs text-gray-400 mt-1 font-medium">{formatRelativeTime(notif.created_at)}</p>
                   </div>
                   {!notif.read && (
                       <div className="w-2 h-2 bg-[#42047e] rounded-full self-center" />
                   )}
                </Link>
             ))
          )}
       </div>
    </div>
  );
}

function getMessage(type: string) {
    if (type === 'like_post') return "curtiu sua publicação.";
    if (type === 'like_comment') return "curtiu seu comentário.";
    if (type === 'reply_comment') return "respondeu seu comentário.";
    if (type === 'mention') return "mencionou você.";
    if (type === 'follow') return "começou a seguir você.";
    return "interagiu com você.";
}