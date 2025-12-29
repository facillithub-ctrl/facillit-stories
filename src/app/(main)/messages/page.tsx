"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import { User } from "@supabase/supabase-js";
import { Search, MessageSquarePlus, ChevronRight, Check, CheckCheck } from "lucide-react";

import { fetchInbox, InboxItem } from "@/services/chat";
import { cn, formatRelativeTime } from "@/lib/utils";

export default function InboxPage() {
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      if (user) {
        const data = await fetchInbox();
        setInbox(data);
      }
      setLoading(false);
    }

    loadData();

    const channel = supabase
      .channel('inbox_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
         fetchInbox().then(setInbox);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); }
  }, []);

  return (
    // SEM SHELL
    <div className="w-full max-w-3xl mx-auto pt-8 px-6 pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
          <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Mensagens</h1>
              <p className="text-gray-400 text-sm font-medium mt-1">Suas conversas privadas.</p>
          </div>
          <button className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-all shadow-lg shadow-black/10">
              <MessageSquarePlus size={20} />
          </button>
      </div>

      {/* Search Bar */}
      <div className="relative group mb-8">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 pl-4 pointer-events-none">
              <Search className="text-gray-300 h-4 w-4 group-focus-within:text-brand-purple transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Buscar nas conversas..." 
            className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-gray-100 transition-all placeholder-gray-400"
          />
      </div>

      {/* Lista de Conversas */}
      <div className="space-y-1">
          {loading ? (
              [...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 py-4 px-2 animate-pulse">
                      <div className="w-12 h-12 bg-gray-100 rounded-full" />
                      <div className="flex-1 space-y-2">
                          <div className="h-3 bg-gray-100 rounded w-1/3" />
                          <div className="h-2 bg-gray-50 rounded w-2/3" />
                      </div>
                  </div>
              ))
          ) : inbox.length > 0 ? (
              inbox.map((item) => (
                 <InboxItemCard key={item.contact.id} item={item} currentUserId={currentUser?.id} />
              ))
          ) : (
              <div className="py-20 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <MessageSquarePlus className="text-gray-300" size={24} />
                  </div>
                  <h3 className="text-gray-900 font-bold mb-1">Nenhuma mensagem</h3>
                  <p className="text-gray-400 text-sm max-w-xs">
                      Inicie uma conversa visitando o perfil de um leitor.
                  </p>
              </div>
          )}
      </div>

    </div>
  );
}

function InboxItemCard({ item, currentUserId }: { item: InboxItem, currentUserId?: string }) {
    const isMe = item.lastMessage.sender_id === currentUserId;
    const isUnread = !isMe && !item.lastMessage.read_at;

    return (
        <Link href={`/messages/${item.contact.id}`} className="group block">
            <div className={cn(
                "flex items-center gap-4 py-4 px-3 rounded-2xl transition-all border border-transparent",
                isUnread ? "bg-brand-purple/5 border-brand-purple/10" : "hover:bg-gray-50"
            )}>
                <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gray-100 relative overflow-hidden border border-gray-100">
                        {item.contact.avatar_url ? (
                            <Image src={item.contact.avatar_url} alt={item.contact.nickname} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-300">
                                {item.contact.nickname[0].toUpperCase()}
                            </div>
                        )}
                    </div>
                    {isUnread && (
                        <div className="absolute top-0 right-0 w-3 h-3 bg-brand-purple rounded-full border-2 border-white" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                        <h3 className={cn("text-sm truncate", isUnread ? "font-black text-gray-900" : "font-bold text-gray-800")}>
                            {item.contact.nickname}
                        </h3>
                        <span className={cn("text-[10px] font-medium shrink-0 ml-2", isUnread ? "text-brand-purple" : "text-gray-400")}>
                            {formatRelativeTime(item.lastMessage.created_at)}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        {isMe && (
                            <span className={cn("shrink-0", item.lastMessage.read_at ? "text-brand-purple" : "text-gray-300")}>
                                {item.lastMessage.read_at ? <CheckCheck size={12}/> : <Check size={12}/>}
                            </span>
                        )}
                        <p className={cn(
                            "text-xs truncate leading-relaxed", 
                            isUnread ? "text-gray-900 font-semibold" : "text-gray-500 font-medium"
                        )}>
                            {item.lastMessage.content}
                        </p>
                    </div>
                </div>

                <div className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity -ml-2">
                    <ChevronRight size={16} />
                </div>
            </div>
        </Link>
    )
}