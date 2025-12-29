"use client";

import { useState, useEffect, useRef } from "react";
import { X, Heart, MessageSquare, CornerDownRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { toggleCommentLike, addComment } from "@/actions/interactions";
import { cn, formatRelativeTime } from "@/lib/utils";
import { VerificationBadge } from "@/components/ui/VerificationBadge";

// TIPAGEM
interface CommentData {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  profiles: {
    nickname: string | null;
    avatar_url: string | null;
    verification_badge: string | null;
  } | null;
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

export function CommentsModal({ postId, postOwnerId, isOpen, onClose, currentUserAvatar, currentUserId }: CommentsModalProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [replyingTo, setReplyingTo] = useState<{ id: string, nickname: string } | null>(null);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (isOpen) {
      fetchComments();
      document.body.style.overflow = 'hidden';
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
    
    // UI Otimista (opcional, aqui vamos confiar no re-fetch para simplicidade da árvore)
    const result = await addComment(
        postId, 
        newComment, 
        currentUserId, 
        replyingTo?.id || null, 
        postOwnerId
    );

    if (result?.error) {
        alert("Erro ao comentar.");
    } else {
        setNewComment("");
        setReplyingTo(null);
        fetchComments();
    }
  }

  const handleLike = async (commentId: string, ownerId: string, isLiked: boolean) => {
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        const newLikes = isLiked 
          ? c.comment_likes.filter(l => l.user_id !== currentUserId)
          : [...c.comment_likes, { user_id: currentUserId }];
        return { ...c, comment_likes: newLikes };
      }
      return c;
    }));
    await toggleCommentLike(commentId, currentUserId, ownerId);
  };

  // --- SUBCOMPONENTE DE ITEM (COM CASCATA E BOTÃO VER RESPOSTAS) ---
  const CommentItem = ({ comment }: { comment: CommentData }) => {
      const [showReplies, setShowReplies] = useState(false);
      const isLiked = comment.comment_likes?.some(l => l.user_id === currentUserId);
      const likesCount = comment.comment_likes?.length || 0;
      const nickname = comment.profiles?.nickname || "Anônimo";
      const hasReplies = comment.replies && comment.replies.length > 0;

      return (
          <div className="flex flex-col mb-4">
              <div className="flex gap-3 items-start group">
                  {/* Avatar */}
                  <Link href={`/u/${nickname}`} className="shrink-0 pt-1">
                      <div className="w-8 h-8 rounded-full bg-white border border-gray-100 relative overflow-hidden hover:border-brand-purple/50 transition-colors">
                          {comment.profiles?.avatar_url ? (
                              <Image src={comment.profiles.avatar_url} alt={nickname} fill className="object-cover" />
                          ) : (
                              <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-gray-400">{nickname[0]?.toUpperCase()}</div>
                          )}
                      </div>
                  </Link>

                  {/* Conteúdo (Clean White) */}
                  <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                          <Link href={`/u/${nickname}`} className="text-xs font-bold text-gray-900 hover:underline flex items-center gap-1">
                              {nickname}
                              <VerificationBadge badge={comment.profiles?.verification_badge} size="sm" />
                          </Link>
                          <span className="text-[10px] text-gray-300">{formatRelativeTime(comment.created_at)}</span>
                      </div>

                      <p className="text-[13px] text-gray-700 leading-snug mt-0.5 whitespace-pre-wrap font-normal">
                          {comment.content}
                      </p>

                      <div className="flex items-center gap-4 mt-1.5">
                          <button 
                              onClick={() => {
                                setReplyingTo({ id: comment.id, nickname });
                                inputRef.current?.focus();
                              }}
                              className="text-[10px] font-medium text-gray-400 hover:text-brand-purple transition-colors"
                          >
                              Responder
                          </button>
                          <button 
                              onClick={() => handleLike(comment.id, comment.user_id, !!isLiked)}
                              className={cn("flex items-center gap-1 text-[10px] font-medium transition-colors", isLiked ? "text-red-500" : "text-gray-400 hover:text-red-500")}
                          >
                              <Heart size={10} className={cn(isLiked && "fill-current")} />
                              {likesCount > 0 && <span>{likesCount}</span>}
                          </button>
                      </div>
                  </div>
              </div>

              {/* Botão Ver Respostas e Lista de Filhos */}
              {hasReplies && (
                  <div className="ml-11 mt-1">
                      {!showReplies ? (
                          <button 
                            onClick={() => setShowReplies(true)}
                            className="flex items-center gap-2 text-[11px] font-semibold text-brand-purple hover:underline"
                          >
                              <div className="w-6 h-px bg-brand-purple/20" />
                              Ver {comment.replies!.length} respostas
                          </button>
                      ) : (
                          <div className="flex flex-col border-l-2 border-gray-100 pl-3 pt-2 space-y-3">
                              {comment.replies!.map(reply => <CommentItem key={reply.id} comment={reply} />)}
                              <button 
                                onClick={() => setShowReplies(false)}
                                className="text-[10px] text-gray-400 hover:text-gray-600 self-start mt-1"
                              >
                                  Ocultar respostas
                              </button>
                          </div>
                      )}
                  </div>
              )}
          </div>
      );
  };

  // Helper para montar árvore
  const buildTree = (list: CommentData[]) => {
      const map: Record<string, number> = {};
      const roots: CommentData[] = [];
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
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      
      <div className="bg-white w-full max-w-[500px] sm:rounded-2xl shadow-xl flex flex-col h-[90vh] sm:h-[650px] relative z-10 animate-in slide-in-from-bottom-10 duration-300">
        
        {/* Header Clean */}
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between bg-white rounded-t-2xl">
          <h3 className="text-sm font-bold text-gray-900">Comentários</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-50 transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-hide bg-white">
          {loading ? (
             <div className="flex justify-center py-10"><div className="w-5 h-5 border-2 border-gray-200 border-t-brand-purple rounded-full animate-spin"/></div>
          ) : comments.length === 0 ? (
             <div className="text-center py-16">
                 <MessageSquare size={32} className="mx-auto text-gray-200 mb-2"/>
                 <p className="text-xs text-gray-400">Nenhum comentário ainda.</p>
             </div>
          ) : (
             tree.map(rootComment => <CommentItem key={rootComment.id} comment={rootComment} />)
          )}
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-50">
           {replyingTo && (
               <div className="flex items-center justify-between px-2 mb-2 text-[10px] text-gray-400">
                   <span>Respondendo a @{replyingTo.nickname}</span>
                   <button onClick={() => setReplyingTo(null)}><X size={10}/></button>
               </div>
           )}
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden relative shrink-0 border border-gray-100">
                 {currentUserAvatar && <Image src={currentUserAvatar} alt="Eu" fill className="object-cover" />}
              </div>
              <div className="flex-1 flex items-center bg-gray-50 rounded-full px-4 border border-transparent focus-within:border-gray-200 focus-within:bg-white transition-all">
                  <input 
                     ref={inputRef}
                     type="text" 
                     className="flex-1 bg-transparent border-none focus:ring-0 text-[13px] placeholder-gray-400 py-2.5"
                     placeholder={replyingTo ? "Escreva sua resposta..." : "Adicione um comentário..."}
                     value={newComment}
                     onChange={(e) => setNewComment(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                  />
                  <button 
                    disabled={!newComment.trim()}
                    onClick={handleSendComment}
                    className="text-brand-purple font-bold text-xs disabled:opacity-30 ml-2 hover:opacity-80 uppercase tracking-wide"
                  >
                     Enviar
                  </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}