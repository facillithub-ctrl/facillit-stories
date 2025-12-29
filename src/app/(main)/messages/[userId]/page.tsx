"use client";

import { useEffect, useRef, useState, use } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Send, ArrowLeft, MoreVertical, Check, CheckCheck, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { fetchMessages, markAsRead, Message } from "@/services/chat";
import { sendMessageAction } from "@/actions/chat"; 
import { VerificationBadge } from "@/components/ui/VerificationBadge";

interface PageProps {
    params: Promise<{ userId: string }>;
}

export default function ChatPage({ params }: PageProps) {
  const { userId: targetUserId } = use(params);

  // Estados
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [targetUser, setTargetUser] = useState<{ nickname: string, avatar_url: string | null, verification_badge: string | null } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cliente HUB para Auth e Perfis
  const hubSupabase = createBrowserClient(
    process.env.NEXT_PUBLIC_HUB_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_HUB_ANON_KEY!
  );

  // Cliente STORIES para Realtime
  const storiesSupabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Inicialização (Auth + Perfil + Mensagens)
  useEffect(() => {
    async function init() {
      if (!targetUserId || targetUserId === 'undefined') return;

      // Pegar usuário logado no HUB
      const { data: { user } } = await hubSupabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // Buscar perfil do destinatário no HUB (Garante foto correta)
      const { data: target } = await hubSupabase
        .from("profiles")
        .select("nickname, avatar_url, verification_badge")
        .eq("user_id", targetUserId)
        .single();
        
      if (target) setTargetUser(target);

      // Carregar mensagens (Isso vem do Stories via service)
      const initialMsgs = await fetchMessages(targetUserId);
      setMessages(initialMsgs);
      setLoading(false);
      
      markAsRead(targetUserId);
    }
    init();
  }, [targetUserId]);

  // 2. Realtime (Conecta no Stories DB)
  useEffect(() => {
    if (!currentUserId || !targetUserId) return;

    const channel = storiesSupabase
      .channel(`chat:${currentUserId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `receiver_id=eq.${currentUserId}`
      }, (payload) => {
        const newMsg = payload.new as Message;
        if (newMsg.sender_id === targetUserId) {
           setMessages(prev => [...prev, newMsg]);
           markAsRead(targetUserId);
        }
      })
      .subscribe();

    return () => { storiesSupabase.removeChannel(channel); }
  }, [currentUserId, targetUserId]);

  // 3. Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // 4. Enviar
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !currentUserId || isSending) return;
    
    setIsSending(true);
    const contentToSend = newMessage;
    setNewMessage(""); 
    inputRef.current?.focus();

    // UI Otimista
    const tempId = Math.random().toString();
    const tempMsg: Message = {
        id: tempId,
        content: contentToSend,
        sender_id: currentUserId,
        receiver_id: targetUserId,
        created_at: new Date().toISOString(),
        read_at: null
    };
    setMessages(prev => [...prev, tempMsg]);

    // Server Action (Resolve o problema de Auth Cross-DB)
    const result = await sendMessageAction(contentToSend, targetUserId);

    if (result.error) {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        alert("Erro ao enviar: " + result.error);
        setNewMessage(contentToSend);
    }
    
    setIsSending(false);
  };

  if (!targetUserId || targetUserId === 'undefined') {
      return <div className="p-10 text-center text-gray-400">Conversa não encontrada.</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] lg:h-screen w-full bg-white relative">
      
      {/* Header */}
      <div className="shrink-0 px-6 py-3 border-b border-gray-50 flex items-center justify-between bg-white/90 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
              <Link href="/messages" className="lg:hidden p-2 -ml-3 text-gray-400 hover:text-black transition-colors">
                  <ArrowLeft size={22} />
              </Link>
              
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-50 relative overflow-hidden border border-gray-100">
                      {targetUser?.avatar_url ? (
                          <Image src={targetUser.avatar_url} alt="User" fill className="object-cover" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-300">
                              {targetUser?.nickname?.[0]?.toUpperCase()}
                          </div>
                      )}
                  </div>
                  <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-gray-900 leading-none">
                            {targetUser?.nickname || "Carregando..."}
                        </span>
                        <VerificationBadge badge={targetUser?.verification_badge} size="xs" />
                      </div>
                      <span className="text-[10px] font-medium text-gray-400 mt-0.5">Online agora</span>
                  </div>
              </div>
          </div>
          <button className="text-gray-300 hover:text-black transition-colors p-2">
              <MoreVertical size={20} />
          </button>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white scrollbar-thin scrollbar-thumb-gray-50">
          {messages.map((msg, idx) => {
              const isMe = msg.sender_id === currentUserId;
              const isFirstInGroup = idx === 0 || messages[idx-1].sender_id !== msg.sender_id;

              return (
                  <div key={msg.id} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn("flex max-w-[85%] sm:max-w-[70%] gap-2", isMe ? "flex-row-reverse" : "flex-row")}>
                          
                          {/* Avatar apenas na primeira msg do grupo recebido */}
                          {!isMe && (
                              <div className="w-8 h-8 shrink-0 flex flex-col justify-end">
                                  {isFirstInGroup ? (
                                     <div className="w-8 h-8 rounded-full bg-gray-50 overflow-hidden border border-gray-50 relative">
                                        {targetUser?.avatar_url && <Image src={targetUser.avatar_url} alt="" fill className="object-cover"/>}
                                     </div>
                                  ) : <div className="w-8" />}
                              </div>
                          )}

                          {/* Balão */}
                          <div className={cn(
                              "px-4 py-2.5 text-[15px] leading-relaxed relative transition-all",
                              isMe 
                                  ? "bg-gradient-to-br from-[#42047e] to-[#6d28d9] text-white rounded-2xl rounded-br-none shadow-sm" 
                                  : "bg-gray-50 text-gray-800 border border-gray-100/50 rounded-2xl rounded-bl-none",
                              !isFirstInGroup && isMe && "mt-[-10px] rounded-tr-md",
                              !isFirstInGroup && !isMe && "mt-[-10px] rounded-tl-md"
                          )}>
                              {msg.content}
                              
                              <div className={cn(
                                  "text-[9px] font-medium mt-1 flex items-center gap-1 justify-end opacity-80",
                                  isMe ? "text-purple-100" : "text-gray-400"
                              )}>
                                  {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  {isMe && (
                                      msg.read_at ? <CheckCheck size={11} className="text-[#07f49e]" /> : <Check size={11} />
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>
              )
          })}
          <div ref={scrollRef} className="h-px" />
      </div>

      {/* Input Area */}
      <div className="shrink-0 p-4 bg-white border-t border-gray-50">
          <form 
            onSubmit={handleSend}
            className="flex items-center gap-3 bg-gray-50/50 p-1.5 pl-5 rounded-full border border-gray-100 focus-within:border-[#42047e]/20 focus-within:bg-white focus-within:shadow-lg focus-within:shadow-[#42047e]/5 transition-all duration-300"
          >
              <input 
                  ref={inputRef}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] placeholder-gray-400 text-gray-900 h-10"
                  placeholder="Escreva uma mensagem..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  disabled={isSending}
              />
              <button 
                  type="submit"
                  disabled={!newMessage.trim() || isSending}
                  className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-[#42047e] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:bg-gray-200 shadow-md"
              >
                  {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
              </button>
          </form>
      </div>

    </div>
  );
}