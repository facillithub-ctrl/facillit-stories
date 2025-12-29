"use client";

import { useState, useEffect, useRef } from "react";
import { X, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { toggleCommentLike } from "@/actions/interactions";
import { cn, formatRelativeTime } from "@/lib/utils"; // Importa do utils corrigido
import { VerificationBadge } from "@/components/ui/VerificationBadge";

interface ProfileData {
  nickname: string | null;
  avatar_url: string | null;
  verification_badge: string | null;
}

interface CommentLikeData {
  user_id: string;
}

interface CommentData {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: ProfileData | null;
  comment_likes: CommentLikeData[];
}

interface CommentsModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserAvatar?: string | null;
  currentUserId: string;
}

export function CommentsModal({ postId, isOpen, onClose, currentUserAvatar, currentUserId }: CommentsModalProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
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
    const { data, error } = await supabase
      .from("comments")
      .select(`
        id,
        content,
        created_at,
        user_id,
        profiles (nickname, avatar_url, verification_badge),
        comment_likes (user_id)
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (!error && data) {
        // Cast seguro
        setComments(data as unknown as CommentData[]);
    }
    setLoading(false);
  }

  async function handleSendComment() {
    if (!newComment.trim()) return;

    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: currentUserId,
      content: newComment
    });

    if (!error) {
      setNewComment("");
      fetchComments();
    }
  }

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        const newLikes = isLiked 
          ? c.comment_likes.filter(l => l.user_id !== currentUserId)
          : [...c.comment_likes, { user_id: currentUserId }];
        return { ...c, comment_likes: newLikes };
      }
      return c;
    }));
    await toggleCommentLike(commentId, currentUserId);
  };

  const handleReply = (nickname: string | null | undefined) => {
    if (!nickname) return;
    setNewComment(`@${nickname} `);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      
      <div className="bg-white w-full max-w-[500px] sm:rounded-2xl shadow-2xl flex flex-col h-[85vh] sm:h-[600px] relative z-10 animate-in slide-in-from-bottom-10 duration-300">
        
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white rounded-t-2xl z-20">
          <h3 className="text-sm font-bold text-gray-900">Comentários</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
          {loading ? (
             <div className="flex justify-center py-8">
               <div className="w-5 h-5 border-2 border-brand-purple border-t-transparent rounded-full animate-spin"/>
             </div>
          ) : comments.length === 0 ? (
             <div className="text-center py-12 text-gray-400 text-xs">Seja o primeiro a comentar.</div>
          ) : (
            comments.map((comment) => {
              const isLiked = comment.comment_likes?.some(l => l.user_id === currentUserId);
              const likesCount = comment.comment_likes?.length || 0;
              const nickname = comment.profiles?.nickname || "Anônimo";
              const avatar = comment.profiles?.avatar_url;

              return (
                <div key={comment.id} className="flex gap-3 items-start group">
                  <Link href={`/u/${nickname}`} className="shrink-0 pt-1">
                    <div className="w-8 h-8 rounded-full bg-gray-100 relative overflow-hidden border border-gray-100 hover:border-brand-purple/30 transition-colors">
                      {avatar ? (
                        <Image src={avatar} alt="User" fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-gray-400">
                           {nickname[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0">
                     <div className="flex items-baseline gap-2">
                        <Link href={`/u/${nickname}`} className="text-xs font-bold text-gray-900 hover:underline flex items-center gap-1">
                           {nickname}
                           <VerificationBadge badge={comment.profiles?.verification_badge} size="sm" />
                        </Link>
                        <span className="text-[10px] text-gray-400">
                           {formatRelativeTime(comment.created_at)}
                        </span>
                     </div>
                     
                     <p className="text-[13px] text-gray-700 leading-snug mt-1 whitespace-pre-wrap font-normal">
                        {comment.content}
                     </p>

                     <div className="flex items-center gap-4 mt-2">
                        <button 
                          onClick={() => handleReply(nickname)}
                          className="text-[10px] font-semibold text-gray-400 hover:text-gray-900 transition-colors"
                        >
                           Responder
                        </button>
                        
                        <button 
                           onClick={() => handleLikeComment(comment.id, !!isLiked)}
                           className={cn(
                             "flex items-center gap-1 text-[10px] font-semibold transition-colors",
                             isLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"
                           )}
                        >
                           <Heart size={10} className={cn(isLiked && "fill-current")} />
                           {likesCount > 0 && <span>{likesCount}</span>}
                           {likesCount === 0 && <span className="opacity-0 group-hover:opacity-100 transition-opacity">Curtir</span>}
                        </button>
                     </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 bg-white border-t border-gray-100 pb-safe">
           <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-transparent focus-within:border-brand-purple/20 focus-within:bg-white transition-all shadow-sm">
              <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden relative shrink-0">
                 {currentUserAvatar && <Image src={currentUserAvatar} alt="Eu" fill className="object-cover" /> }
              </div>
              <input 
                 ref={inputRef}
                 type="text" 
                 className="flex-1 bg-transparent border-none focus:ring-0 text-[13px] placeholder-gray-400 p-0"
                 placeholder="Adicione um comentário..."
                 value={newComment}
                 onChange={(e) => setNewComment(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
                 autoFocus={!loading}
              />
              <button 
                disabled={!newComment.trim()}
                onClick={handleSendComment}
                className="text-brand-purple font-bold text-xs disabled:opacity-30 hover:opacity-80 transition-opacity uppercase tracking-wide"
              >
                 PUBLICAR
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}