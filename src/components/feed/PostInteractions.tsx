"use client";

import { useState } from "react";
import { Heart, MessageSquare, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleLike } from "@/actions/interactions";
import { CommentsModal } from "./CommentsModal";

interface PostInteractionsProps {
  postId: string;
  postOwnerId: string; // Necessário para notificar o dono do post
  currentUserId: string;
  currentUserAvatar?: string | null;
  initialLikesCount: number;
  initialCommentsCount: number;
  initialIsLiked: boolean;
  allowComments: boolean;
}

export function PostInteractions({
  postId,
  postOwnerId,
  currentUserId,
  currentUserAvatar,
  initialLikesCount,
  initialCommentsCount,
  initialIsLiked,
  allowComments
}: PostInteractionsProps) {
  // Estado Local para UI Otimista (Resposta imediata ao clique)
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function handleLike() {
    // Guarda estado anterior para rollback em caso de erro
    const previousState = isLiked;
    const previousCount = likesCount;

    // Atualiza a interface instantaneamente
    setIsLiked(!previousState);
    setLikesCount(previousState ? previousCount - 1 : previousCount + 1);

    try {
      // Chama a Server Action (Backend)
      await toggleLike(postId, currentUserId, postOwnerId);
    } catch (error) {
      console.error("Erro ao curtir:", error);
      // Reverte a interface se falhar
      setIsLiked(previousState);
      setLikesCount(previousCount);
    }
  }

  return (
    <>
      <div className="flex items-center gap-6 pt-1 border-t border-transparent group-hover:border-gray-50 transition-colors">
        
        {/* Botão de Like */}
        <button
          onClick={handleLike}
          className="flex items-center gap-1.5 group/btn py-1 transition-all"
        >
          <Heart
            size={18}
            className={cn(
              "transition-transform duration-300 group-active/btn:scale-90",
              isLiked 
                ? "fill-red-500 text-red-500" 
                : "text-gray-400 group-hover/btn:text-red-500"
            )}
          />
          <span className={cn(
            "text-xs font-semibold transition-colors", 
            isLiked ? "text-red-600" : "text-gray-500"
          )}>
            {likesCount > 0 ? likesCount : ""}
          </span>
        </button>

        {/* Botão de Comentário */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 group/btn py-1 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!allowComments}
        >
          <MessageSquare
            size={18}
            className="text-gray-400 group-hover/btn:text-brand-purple transition-colors"
          />
          <span className="text-xs font-semibold text-gray-500 group-hover/btn:text-brand-purple">
            {initialCommentsCount > 0 ? initialCommentsCount : ""}
          </span>
        </button>

        {/* Botão de Salvar (Placeholder funcional) */}
        <button className="ml-auto text-gray-300 hover:text-black transition-colors">
          <Bookmark size={18} />
        </button>
      </div>

      {/* Modal de Comentários (Carregado sob demanda visual) */}
      <CommentsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        postId={postId}
        postOwnerId={postOwnerId}
        currentUserId={currentUserId}
        currentUserAvatar={currentUserAvatar}
      />
    </>
  );
}