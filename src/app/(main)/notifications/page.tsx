"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import { User } from "@supabase/supabase-js";
import { Heart, MessageCircle, Zap, Bell, UserPlus, ArrowRight } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { NotificationItem, NotificationTab } from "@/types/db";

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<NotificationTab>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchNotifs() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; 

        setCurrentUser(user);

        const { data, error } = await supabase
          .from("notifications")
          .select(`*, actor:actor_id(nickname, avatar_url)`)
          .eq("recipient_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);
        
        if (!error && data) {
          setNotifications(data as unknown as NotificationItem[]);
        }
      } catch (err) {
        console.error("Erro ao carregar notificações", err);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifs();
  }, []);

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
  };

  return (
    // SEM SHELL
    <div className="max-w-2xl mx-auto min-h-screen pb-32 px-4 lg:px-0 pt-20 lg:pt-8">
          
        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-50 rounded-full">
                <Bell className="text-[#42047e]" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notificações</h1>
        </div>
        
        {/* Abas */}
        <div className="border-b border-gray-100 mb-6 py-2 bg-white relative z-0">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {[
                    { id: 'all', label: 'Tudo' }, 
                    { id: 'likes', label: 'Curtidas' }, 
                    { id: 'comments', label: 'Respostas' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as NotificationTab)}
                        className={cn(
                            "px-4 py-1.5 text-xs font-bold rounded-lg transition-all capitalize whitespace-nowrap",
                            activeTab === tab.id 
                                ? "bg-gray-900 text-white shadow-md ring-0" 
                                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Lista */}
        <div className="space-y-3 relative z-0">
            {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-gray-50/50 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/4" />
                    </div>
                </div>
                ))
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-gray-200 rounded-3xl bg-gray-50/30">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100">
                        <Bell className="text-gray-300" size={20} />
                    </div>
                    <h3 className="text-gray-900 font-bold text-sm">Tudo limpo</h3>
                    <p className="text-gray-400 text-xs mt-1">Nenhuma notificação por enquanto.</p>
                </div>
            ) : (
                filtered.map(notif => (
                    <Link 
                    href={notif.resource_id ? `/post/${notif.resource_id}` : `/u/${notif.actor?.nickname}`} 
                    key={notif.id}
                    className={cn(
                        "group flex items-start gap-4 p-4 rounded-2xl transition-all border relative overflow-hidden hover:shadow-md hover:border-purple-100",
                        notif.read 
                            ? "bg-white border-transparent hover:bg-gray-50" 
                            : "bg-[#F5F3FF]/40 border-[#42047e]/10"
                    )}
                    >
                        <div className="relative shrink-0 pt-1">
                            <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-100 group-hover:border-[#42047e]/30 transition-colors">
                                {notif.actor?.avatar_url ? (
                                    <Image src={notif.actor.avatar_url} alt="User" fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-bold text-xs text-gray-400 bg-gray-100">
                                        {notif.actor?.nickname?.[0]?.toUpperCase() || "?"}
                                    </div>
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm border border-gray-50">
                                {getIcon(notif.type)}
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 leading-snug">
                                <span className="font-bold text-black group-hover:text-[#42047e] transition-colors">
                                {notif.actor?.nickname || "Usuário"}
                                </span> {getMessage(notif.type)}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                    {formatRelativeTime(notif.created_at)}
                                </span>
                                
                                {notif.resource_id && (
                                    <span className="flex items-center text-[10px] font-bold text-[#42047e] bg-[#42047e]/5 px-2 py-0.5 rounded-full group-hover:bg-[#42047e] group-hover:text-white transition-all">
                                        Ler tudo <ArrowRight size={10} className="ml-1" />
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        {!notif.read && (
                            <div className="w-2 h-2 bg-[#42047e] rounded-full self-center shrink-0" />
                        )}
                    </Link>
                ))
            )}
        </div>
    </div>
  );
}

function getMessage(type: string) {
    const messages: Record<string, string> = {
      'like_post': "curtiu sua publicação.",
      'like_comment': "curtiu seu comentário.",
      'reply_comment': "respondeu seu comentário.",
      'mention': "mencionou você.",
      'follow': "começou a seguir você."
    };
    return messages[type] || "interagiu com você.";
}