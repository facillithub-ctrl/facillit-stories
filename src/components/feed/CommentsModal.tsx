"use client";

import { useState, useEffect } from "react";
import { X, Send, Heart, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    nickname: string;
    avatar_url: string | null;
    verification_badge: string | null;
  };
}

interface CommentsModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserAvatar?: string | null;
}

export function CommentsModal({ postId, isOpen, onClose, currentUserAvatar }: CommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  // Cliente Supabase Client-Side
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Buscar Comentários ao abrir
  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, postId]);

  async function fetchComments() {
    setLoading(true);
    const { data } = await supabase
      .from("comments")
      .select(`
        *,
        profiles (nickname, avatar_url, verification_badge)
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true }); // Mais antigos primeiro (estilo chat) ou desc

    if (data) setComments(data as any);
    setLoading(false);
  }

  async function handleSendComment() {
    if (!newComment.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Inserir
    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: user.id,
      content: newComment
    });

    if (!error) {
      setNewComment("");
      fetchComments(); // Recarrega
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      
      {/* Container do Modal */}
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
          <h3 className="text-sm font-bold text-gray-900">Comentários</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Lista de Comentários */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#FAFAFA]">
          {loading ? (
             <div className="text-center py-10 text-gray-400 text-xs">Carregando conversas...</div>
          ) : comments.length === 0 ? (
             <div className="text-center py-10 text-gray-400 text-xs">Seja o primeiro a comentar.</div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 items-start group">
                {/* Avatar */}
                <Link href={`/u/${comment.profiles?.nickname || 'me'}`} className="shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden relative border border-gray-100">
                    {comment.profiles?.avatar_url ? (
                      <Image src={comment.profiles.avatar_url} alt="User" fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100" />
                    )}
                  </div>
                </Link>

                {/* Balão */}
                <div className="flex-1 space-y-1">
                   <div className="flex items-baseline justify-between">
                      <div className="flex items-center gap-2">
                         <span className="text-xs font-bold text-gray-900 hover:underline cursor-pointer">
                            {comment.profiles?.nickname || "Usuário"}
                         </span>
                         <span className="text-[10px] text-gray-400">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
                         </span>
                      </div>
                   </div>
                   
                   <p className="text-sm text-gray-700 leading-relaxed font-light">
                      {comment.content}
                   </p>

                   {/* Ações do Comentário */}
                   <div className="flex items-center gap-4 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-[10px] font-bold text-gray-400 hover:text-red-500 flex items-center gap-1">
                         <Heart size={10} /> Curtir
                      </button>
                      <button className="text-[10px] font-bold text-gray-400 hover:text-gray-900">
                         Responder
                      </button>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
           <div className="flex items-center gap-3 bg-gray-50 rounded-full px-4 py-2 border border-gray-100 focus-within:border-gray-300 focus-within:ring-1 focus-within:ring-gray-200 transition-all">
              <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden relative shrink-0">
                 {currentUserAvatar && <Image src={currentUserAvatar} alt="Eu" fill className="object-cover" />}
              </div>
              <input 
                 type="text" 
                 className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder-gray-400"
                 placeholder="Adicione um comentário..."
                 value={newComment}
                 onChange={(e) => setNewComment(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
              />
              <button 
                disabled={!newComment.trim()}
                onClick={handleSendComment}
                className="text-brand-purple disabled:opacity-30 hover:scale-110 transition-transform font-bold text-sm"
              >
                 Publicar
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}