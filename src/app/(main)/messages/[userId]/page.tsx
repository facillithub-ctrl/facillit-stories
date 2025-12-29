"use client";

import { useEffect, useRef, useState, use } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Send, ArrowLeft, MoreVertical, Check, CheckCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Shell } from "@/components/layout/Shell";
import { fetchMessages, sendMessage, markAsRead, Message } from "@/services/chat";

// Tipagem para params em Next.js 15+ (Promise)
interface PageProps {
    params: Promise<{ userId: string }>;
}

export default function ChatPage({ params }: PageProps) {
  // Desembrulha params com hook use() (React 19 / Next 15)
  const { userId: targetUserId } = use(params);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [targetUser, setTargetUser] = useState<{ nickname: string, avatar_url: string | null } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Setup Inicial
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // Buscar info do alvo
      const { data: target } = await supabase.from("profiles").select("nickname, avatar_url").eq("user_id", targetUserId).single();
      if (target) setTargetUser(target);

      // Carregar msg antigas
      const initialMsgs = await fetchMessages(targetUserId);
      setMessages(initialMsgs);
      
      // Marcar lidas
      markAsRead(targetUserId);
    }
    init();
  }, [targetUserId]);

  // 2. Realtime Subscription
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel(`chat:${currentUserId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `receiver_id=eq.${currentUserId}` // Escuta apenas msg recebidas
      }, (payload) => {
        const newMsg = payload.new as Message;
        if (newMsg.sender_id === targetUserId) {
           setMessages(prev => [...prev, newMsg]);
           markAsRead(targetUserId); // Marca como lida se estiver na janela
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); }
  }, [currentUserId, targetUserId]);

  // 3. Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !currentUserId) return;
    
    // Optimistic Update
    const tempId = Math.random().toString();
    const tempMsg: Message = {
        id: tempId,
        content: newMessage,
        sender_id: currentUserId,
        receiver_id: targetUserId,
        created_at: new Date().toISOString(),
        read_at: null
    };

    setMessages(prev => [...prev, tempMsg]);
    setNewMessage("");

    await sendMessage(tempMsg.content, targetUserId);
    // Em um app real, substituiríamos o ID temporário pelo real retornado
  };

  return (
    <Shell>
      <div className="h-[calc(100vh-80px)] lg:h-screen flex flex-col bg-white max-w-4xl mx-auto border-x border-gray-50 shadow-sm">
        
        {/* Header do Chat */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur sticky top-0 z-10">
            <div className="flex items-center gap-3">
                <Link href="/messages" className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-black">
                    <ArrowLeft size={20} />
                </Link>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 relative overflow-hidden border border-gray-100">
                        {targetUser?.avatar_url ? (
                            <Image src={targetUser.avatar_url} alt="User" fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-300">
                                {targetUser?.nickname?.[0]}
                            </div>
                        )}
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-900 leading-tight">
                            {targetUser?.nickname || "Carregando..."}
                        </h2>
                        <span className="text-[10px] text-green-500 font-bold flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Online
                        </span>
                    </div>
                </div>
            </div>
            <button className="text-gray-300 hover:text-black transition-colors"><MoreVertical size={18} /></button>
        </div>

        {/* Área de Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
            {messages.map((msg, idx) => {
                const isMe = msg.sender_id === currentUserId;
                const showAvatar = !isMe && (idx === 0 || messages[idx-1].sender_id !== msg.sender_id);

                return (
                    <div key={msg.id} className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}>
                        <div className={cn("flex max-w-[75%] gap-2", isMe ? "flex-row-reverse" : "flex-row")}>
                            
                            {/* Avatar Pequeno nas msgs recebidas */}
                            {!isMe && (
                                <div className="w-6 h-6 rounded-full bg-gray-100 overflow-hidden shrink-0 mt-auto opacity-100">
                                    {showAvatar ? (
                                        targetUser?.avatar_url && <Image src={targetUser.avatar_url} alt="" width={24} height={24} className="object-cover w-full h-full"/>
                                    ) : <div className="w-6" />}
                                </div>
                            )}

                            <div className={cn(
                                "px-4 py-2 rounded-2xl text-sm leading-relaxed relative group transition-all",
                                isMe 
                                    ? "bg-brand-purple text-white rounded-br-none shadow-lg shadow-brand-purple/10" 
                                    : "bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm"
                            )}>
                                {msg.content}
                                <div className={cn(
                                    "text-[9px] font-medium mt-1 flex items-center gap-1 justify-end opacity-70",
                                    isMe ? "text-purple-100" : "text-gray-400"
                                )}>
                                    {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    {isMe && (
                                        msg.read_at ? <CheckCheck size={10} /> : <Check size={10} />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
            <div ref={scrollRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-50">
            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-full border border-gray-100 focus-within:border-gray-200 focus-within:bg-white transition-colors shadow-sm">
                <input 
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-4 py-2 placeholder-gray-400"
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <button 
                    onClick={handleSend}
                    disabled={!newMessage.trim()}
                    className="p-2.5 bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:scale-90 transition-all"
                >
                    <Send size={16} />
                </button>
            </div>
        </div>

      </div>
    </Shell>
  );
}