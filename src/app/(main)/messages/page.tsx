"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import { Search, MessageSquarePlus, ChevronRight } from "lucide-react";
import { fetchInbox, InboxItem } from "@/services/chat";
import { cn, formatRelativeTime } from "@/lib/utils";
import { VerificationBadge } from "@/components/ui/VerificationBadge";

export default function InboxPage() {
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const hubSupabase = createBrowserClient(
    process.env.NEXT_PUBLIC_HUB_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_HUB_ANON_KEY!
  );

  useEffect(() => {
    async function load() {
      const { data: { user } } = await hubSupabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
         try {
             const data = await fetchInbox();
             setInbox(data);
         } catch (e) {
             console.error("Erro ao carregar inbox", e);
         }
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="w-full min-h-screen bg-white pt-8 px-4 sm:px-8 pb-20">
      
      <div className="flex items-end justify-between mb-8 border-b border-gray-50 pb-6">
          <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Mensagens</h1>
          </div>
          <button className="w-12 h-12 rounded-full bg-gradient-to-r from-[#42047e] to-[#07f49e] text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
              <MessageSquarePlus size={22} />
          </button>
      </div>

      <div className="space-y-1">
          {loading ? (
             <div className="text-center py-20 text-gray-300">Carregando conversas...</div>
          ) : inbox.length > 0 ? (
              inbox.map((item) => {
                 // Proteção extra contra link undefined
                 if (!item?.contact?.id) return null;

                 return (
                    <Link href={`/messages/${item.contact.id}`} key={item.contact.id} className="block group">
                        <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-50">
                            <div className="w-14 h-14 rounded-full bg-gray-50 overflow-hidden relative border border-gray-100">
                            {item.contact.avatar_url ? (
                                <Image src={item.contact.avatar_url} alt="" fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-gray-300">{item.contact.nickname?.[0]}</div>
                            )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between">
                                    <span className="font-bold text-gray-900 text-base flex items-center gap-1">
                                        {item.contact.nickname}
                                        <VerificationBadge badge={item.contact.verification_badge} size="xs" />
                                    </span>
                                    <span className="text-xs text-gray-400 font-medium">{formatRelativeTime(item.lastMessage.created_at)}</span>
                                </div>
                                <p className={cn("truncate text-sm mt-0.5", !item.lastMessage.read_at && item.lastMessage.sender_id !== currentUser?.id ? "font-bold text-gray-900" : "text-gray-500")}>
                                    {item.lastMessage.content}
                                </p>
                            </div>
                            <ChevronRight className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
                        </div>
                    </Link>
                 )
              })
          ) : (
              <div className="py-20 text-center text-gray-400">Nenhuma mensagem ainda.</div>
          )}
      </div>
    </div>
  );
}