"use client";

import { useState, useEffect, useRef, Dispatch, SetStateAction, RefObject } from "react";
import { X, Heart, MessageSquare, Send, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { toggleCommentLike, addComment } from "@/actions/interactions";
import { cn, formatRelativeTime } from "@/lib/utils";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { User } from "@supabase/supabase-js"; // Tipo oficial do Supabase

// --- TIPAGEM ESTRITA ---
interface ProfileData {
  nickname: string | null;
  avatar_url: string | null;
  verification_badge: string | null;
}

interface CommentData {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  profiles: ProfileData | null;
  comment_likes: { user_id: string }[];
  replies?: CommentData[];
}

interface CommentsModalProps {
  postId: string;
  postOwnerId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserAvatar?: string | null;
  currentUserId: string;
}

interface ReplyingToState {
  id: string;
  nickname: string;
}

// --- COMPONENTE PRINCIPAL ---
export function CommentsModal({ postId, postOwnerId, isOpen, onClose, currentUserAvatar, currentUserId }: CommentsModalProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [replyingTo, setReplyingTo] = useState<ReplyingToState | null>(null);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Referência tipada corretamente para o input HTML
  const inputRef = useRef<HTMLInputElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (isOpen) {
      fetchComments();
      document.body.style.overflow = 'hidden'; // Bloqueia scroll do fundo
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; }
  }, [isOpen, postId]);

  async function fetchComments() {
    setLoading(true);
    const { data } = await supabase
      .from("comments")
      .select(`
        *,
        profiles (nickname, avatar_url, verification_badge),
        comment_likes (user_id)
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (data) {
        setComments(data as unknown as CommentData[]);
    }
    setLoading(false);
  }

  async function handleSendComment() {
    if (!newComment.trim()) return;
    
    const contentToSend = newComment;
    const parentId = replyingTo?.id || null;

    // Limpa UI imediatamente
    setNewComment("");
    setReplyingTo(null);

    const result = await addComment(
        postId, 
        contentToSend, 
        currentUserId, 
        parentId, 
        postOwnerId
    );

    if (result?.error) {
        alert("Erro ao comentar.");
    } else {
        fetchComments();
    }
  }

  // Monta a árvore de comentários (Pais e Filhos)
  const buildTree = (list: CommentData[]) => {
      const map: Record<string, number> = {};
      const roots: CommentData[] = [];
      
      // Inicializa replies
      list.forEach((node, i) => {
          map[node.id] = i;
          node.replies = [];
      });

      list.forEach(node => {
          if (node.parent_id && map[node.parent_id] !== undefined) {
              list[map[node.parent_id]].replies?.push(node);
          } else {
              roots.push(node);
          }
      });
      return roots;
  };

  if (!isOpen) return null;
  const tree = buildTree([...comments]);

  return (
    <div className="fixed inset-0 z-[9999] flex justify-center items-end sm:items-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Overlay clicável para fechar */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="bg-white w-full max-w-[550px] relative z-10 flex flex-col shadow-2xl 
        h-[85vh] rounded-t-[2rem] 
        sm:h-[650px] sm:rounded-3xl sm:border sm:border-gray-100
        animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-300 ease-out"
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Comentários</h3>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">{comments.length} interações</p>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Lista Scrollável */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-6 bg-white">
          {loading ? (
             <div className="flex justify-center py-20">
                <div className="w-6 h-6 border-2 border-gray-100 border-t-brand-purple rounded-full animate-spin"/>
             </div>
          ) : tree.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full py-10 opacity-50">
                 <MessageSquare size={32} className="mb-3 text-gray-300"/>
                 <p className="text-xs font-bold text-gray-400">Nenhum comentário ainda.</p>
             </div>
          ) : (
             tree.map(rootComment => (
                <CommentItem 
                    key={rootComment.id} 
                    comment={rootComment} 
                    currentUserId={currentUserId}
                    setReplyingTo={setReplyingTo}
                    inputRef={inputRef}
                />
             ))
          )}
        </div>

        {/* Input Area (Fixa no bottom) */}
        <div className="p-4 bg-white border-t border-gray-50 shrink-0 sm:rounded-b-3xl pb-8 sm:pb-4">
           {replyingTo && (
               <div className="flex items-center justify-between px-3 py-2 mb-2 bg-gray-50 rounded-lg text-[10px] animate-in slide-in-from-bottom-2">
                   <span className="text-gray-500">Respondendo a <span className="font-bold text-brand-purple">@{replyingTo.nickname}</span></span>
                   <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-gray-200 rounded-full"><X size={12}/></button>
               </div>
           )}
           <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden relative shrink-0 border border-gray-100">
                 {currentUserAvatar ? (
                    <Image src={currentUserAvatar} alt="Eu" fill className="object-cover" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-xs font-bold text-gray-300">EU</div>
                 )}
              </div>
              <div className="flex-1 flex items-center bg-gray-50 rounded-2xl px-4 border border-transparent focus-within:bg-white focus-within:border-gray-200 focus-within:shadow-sm transition-all">
                  <input 
                     ref={inputRef}
                     type="text" 
                     className="flex-1 bg-transparent border-none focus:ring-0 text-[13px] placeholder-gray-400 py-3 text-gray-900"
                     placeholder={replyingTo ? "Escreva sua resposta..." : "Adicione uma reflexão..."}
                     value={newComment}
                     onChange={(e) => setNewComment(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                  />
                  <button 
                    disabled={!newComment.trim()}
                    onClick={handleSendComment}
                    className="text-brand-purple p-2 hover:scale-110 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
                  >
                     <Send size={16} className="fill-current" />
                  </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

// --- SUBCOMPONENTE DE ITEM (Sem 'any') ---
interface CommentItemProps {
    comment: CommentData;
    currentUserId: string;
    setReplyingTo: Dispatch<SetStateAction<ReplyingToState | null>>;
    inputRef: RefObject<HTMLInputElement | null>;
}

const CommentItem = ({ comment, currentUserId, setReplyingTo, inputRef }: CommentItemProps) => {
    const [showReplies, setShowReplies] = useState(false);
    const isLiked = comment.comment_likes?.some(l => l.user_id === currentUserId);
    const likesCount = comment.comment_likes?.length || 0;
    const nickname = comment.profiles?.nickname || "Anônimo";
    const avatar = comment.profiles?.avatar_url;
    const hasReplies = comment.replies && comment.replies.length > 0;

    // Função de like local (otimista)
    const handleLike = async () => {
        // Na prática, o estado global deveria ser atualizado ou usar React Query, 
        // mas para manter simples no modal, apenas chamamos a action. 
        // O usuário verá a atualização real no próximo fetch ou revalidação.
        await toggleCommentLike(comment.id, currentUserId, comment.user_id);
    };

    return (
        <div className="flex flex-col animate-in fade-in duration-500">
            <div className="flex gap-3 items-start group">
                <Link href={`/u/${nickname}`} className="shrink-0 pt-0.5">
                    <div className="w-8 h-8 rounded-full bg-white border border-gray-100 relative overflow-hidden">
                        {avatar ? (
                            <Image src={avatar} alt={nickname} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-gray-300">{nickname[0]?.toUpperCase()}</div>
                        )}
                    </div>
                </Link>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                            <Link href={`/u/${nickname}`} className="text-xs font-bold text-gray-900 hover:underline flex items-center gap-1">
                                {nickname}
                                <VerificationBadge badge={comment.profiles?.verification_badge} size="sm" />
                            </Link>
                            <span className="text-[10px] text-gray-300 font-medium">{formatRelativeTime(comment.created_at)}</span>
                        </div>
                        {/* Menu de opções (Reportar/Deletar) - Placeholder */}
                        <button className="text-gray-200 hover:text-gray-900 opacity-0 group-hover:opacity-100 transition-all">
                            <MoreHorizontal size={12} />
                        </button>
                    </div>

                    <p className="text-[13px] text-gray-600 leading-relaxed mt-0.5 whitespace-pre-wrap font-normal">
                        {comment.content}
                    </p>

                    <div className="flex items-center gap-4 mt-2">
                        <button 
                            onClick={() => {
                              setReplyingTo({ id: comment.id, nickname });
                              inputRef.current?.focus();
                            }}
                            className="text-[10px] font-bold text-gray-400 hover:text-brand-purple transition-colors uppercase tracking-wider"
                        >
                            Responder
                        </button>
                        <button 
                            onClick={handleLike}
                            className={cn(
                                "flex items-center gap-1 text-[10px] font-bold transition-colors uppercase tracking-wider", 
                                isLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"
                            )}
                        >
                            <Heart size={10} className={cn(isLiked && "fill-current")} />
                            {likesCount > 0 && <span>{likesCount}</span>}
                        </button>
                    </div>
                </div>
            </div>

            {hasReplies && (
                <div className="ml-11 mt-2">
                    {!showReplies ? (
                        <button 
                          onClick={() => setShowReplies(true)}
                          className="flex items-center gap-2 text-[10px] font-bold text-gray-400 hover:text-brand-purple transition-colors group/btn"
                        >
                            <div className="w-4 h-[1px] bg-gray-200 group-hover/btn:bg-brand-purple" />
                            Ver {comment.replies!.length} respostas
                        </button>
                    ) : (
                        <div className="flex flex-col border-l border-gray-100 pl-4 pt-2 space-y-4">
                            {comment.replies!.map(reply => (
                                <CommentItem 
                                    key={reply.id} 
                                    comment={reply} 
                                    currentUserId={currentUserId}
                                    setReplyingTo={setReplyingTo}
                                    inputRef={inputRef}
                                />
                            ))}
                            <button 
                              onClick={() => setShowReplies(false)}
                              className="text-[10px] text-gray-300 hover:text-gray-500 font-bold self-start uppercase tracking-wider pl-1"
                            >
                                Ocultar
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};