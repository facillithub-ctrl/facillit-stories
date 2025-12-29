"use client";

import { useState } from "react";
import { Heart, MessageSquare, Bookmark, Send } from "lucide-react";
import { toggleLike, addComment } from "@/actions/interactions";
import { cn } from "@/lib/utils";

interface PostInteractionsProps {
  postId: string;
  userId: string;
  initialLikesCount: number;
  initialCommentsCount: number;
  isLikedByMe: boolean;
  commentsEnabled: boolean;
}

export function PostInteractions({ 
  postId, 
  userId, 
  initialLikesCount, 
  initialCommentsCount, 
  isLikedByMe,
  commentsEnabled
}: PostInteractionsProps) {
  
  // Estado Local (Optimistic UI)
  const [liked, setLiked] = useState(isLikedByMe);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState("");

  // Handler de Like
  const handleLike = async () => {
    // Atualiza visualmente na hora
    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);

    // Chama o server
    await toggleLike(postId, userId);
  };

  // Handler de Comentário
  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return;
    
    await addComment(postId, commentText, userId);
    setCommentText("");
    setShowCommentBox(false);
    // Em um app real complexo, atualizaríamos a lista de comentários aqui via prop ou context
  };

  return (
    <div className="flex flex-col gap-4">
        {/* Barra de Botões */}
        <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
            <button 
                onClick={handleLike}
                className="flex items-center gap-2 group transition-colors"
            >
                <Heart 
                    size={20} 
                    className={cn(
                        "transition-all duration-300 group-active:scale-90",
                        liked ? "fill-red-500 text-red-500" : "text-gray-400 group-hover:text-gray-900"
                    )} 
                />
                <span className={cn("text-xs font-bold", liked ? "text-gray-900" : "text-gray-500")}>
                    {likesCount > 0 ? likesCount : "Curtir"}
                </span>
            </button>

            <button 
                onClick={() => commentsEnabled && setShowCommentBox(!showCommentBox)}
                disabled={!commentsEnabled}
                className={cn(
                    "flex items-center gap-2 group transition-colors",
                    !commentsEnabled && "opacity-50 cursor-not-allowed"
                )}
            >
                <MessageSquare size={20} className="text-gray-400 group-hover:text-gray-900" />
                <span className="text-xs font-bold text-gray-500">
                    {initialCommentsCount > 0 ? initialCommentsCount : "Comentar"}
                </span>
            </button>

            <button className="ml-auto text-gray-300 hover:text-brand-purple transition-colors">
                <Bookmark size={20} />
            </button>
        </div>

        {/* Caixa de Comentário (Expandable) */}
        {showCommentBox && (
            <div className="flex gap-2 animate-in slide-in-from-top-2 fade-in duration-200">
                <input 
                    type="text" 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Escreva sua resposta..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                    onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()}
                />
                <button 
                    onClick={handleCommentSubmit}
                    className="p-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
                >
                    <Send size={16} />
                </button>
            </div>
        )}
    </div>
  );
}