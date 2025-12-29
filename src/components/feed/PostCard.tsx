"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageSquare, Bookmark, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleLike } from "@/actions/interactions"; // Sua server action
import { CommentsModal } from "./CommentsModal";
import { VerificationBadge } from "@/components/ui/VerificationBadge"; // Seu componente de badge

interface PostCardProps {
  post: any; // Tipar corretamente conforme seu DB
  currentUserId: string;
  currentUserAvatar?: string | null;
}

export function PostCard({ post, currentUserId, currentUserAvatar }: PostCardProps) {
  // Dados extraídos (Profiles vem via Join)
  const author = post.profiles || {}; 
  const isOfficial = post.is_official;
  
  // Estado local
  const [isLiked, setIsLiked] = useState<boolean>(
    post.likes?.some((l: any) => l.user_id === currentUserId)
  );
  const [likesCount, setLikesCount] = useState<number>(post.likes?.length || 0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const commentsCount = post.comments?.[0]?.count || 0;

  // Handler Like
  async function handleLike() {
    // Optimistic Update
    const newState = !isLiked;
    setIsLiked(newState);
    setLikesCount((prev) => (newState ? prev + 1 : prev - 1));
    
    await toggleLike(post.id, currentUserId);
  }

  return (
    <>
      <article className="group relative bg-white transition-colors duration-500">
        
        {/* HEADER: Avatar + Nome + Data */}
        <div className="flex items-center gap-3 mb-3">
            {/* Avatar Clicável */}
            <Link href={isOfficial ? '#' : `/u/${author.nickname}`} className="block shrink-0">
                <div className={cn(
                    "w-8 h-8 rounded-full overflow-hidden relative border",
                    isOfficial ? "border-transparent ring-2 ring-brand-purple/20" : "border-gray-100"
                )}>
                    {isOfficial ? (
                        <div className="w-full h-full bg-brand-gradient flex items-center justify-center text-white text-[9px] font-bold">FS</div>
                    ) : author.avatar_url ? (
                        <Image src={author.avatar_url} alt={author.nickname} fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gray-50 flex items-center justify-center text-[10px] text-gray-400 font-bold">
                            {author.nickname?.[0]?.toUpperCase()}
                        </div>
                    )}
                </div>
            </Link>

            {/* Info */}
            <div className="flex flex-col leading-none">
                <div className="flex items-center gap-1.5">
                    <Link href={isOfficial ? '#' : `/u/${author.nickname}`} className="text-sm font-bold text-gray-900 hover:text-brand-purple transition-colors">
                        {isOfficial ? "Equipe Facillit Stories" : (author.full_name || author.nickname)}
                    </Link>
                    
                    {/* Badge */}
                    {isOfficial && <Pin size={10} className="text-brand-purple fill-current" />}
                    <VerificationBadge badge={author.verification_badge} size="sm" />
                </div>
                <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                    {new Date(post.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', hour:'2-digit', minute:'2-digit' })}
                </span>
            </div>
        </div>

        {/* CONTENT */}
        <div className="pl-0 sm:pl-11"> {/* Indentação para alinhar com o texto e não o avatar */}
            
            {post.title && (
                <h2 className="text-xl font-bold text-gray-900 mb-2 leading-tight tracking-tight">
                    {post.title}
                </h2>
            )}

            <p className="text-[15px] leading-relaxed text-gray-600 whitespace-pre-wrap font-normal mb-4">
                {post.content}
            </p>

            {post.image_url && (
                <div className="relative w-full h-72 rounded-lg overflow-hidden border border-gray-100 mb-4 bg-gray-50">
                    <Image src={post.image_url} alt="Post content" fill className="object-cover hover:scale-105 transition-transform duration-700" />
                </div>
            )}

            {/* ACTIONS BAR */}
            <div className="flex items-center gap-6 pt-2 border-t border-gray-50/50">
                {/* Botão Curtir */}
                <button 
                    onClick={handleLike}
                    className="flex items-center gap-1.5 group py-1"
                >
                    <Heart 
                        size={18} 
                        className={cn(
                            "transition-all duration-300 group-active:scale-90",
                            isLiked ? "fill-red-500 text-red-500" : "text-gray-400 group-hover:text-red-500"
                        )} 
                    />
                    <span className={cn("text-xs font-semibold", isLiked ? "text-red-600" : "text-gray-500")}>
                        {likesCount || ""}
                    </span>
                </button>

                {/* Botão Comentar (Abre Modal) */}
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-1.5 group py-1"
                    disabled={!post.allow_comments}
                >
                    <MessageSquare size={18} className="text-gray-400 group-hover:text-brand-purple transition-colors" />
                    <span className="text-xs font-semibold text-gray-500 group-hover:text-brand-purple">
                        {commentsCount > 0 ? commentsCount : ""}
                    </span>
                </button>

                {/* Botão Salvar (Fim) */}
                <button className="ml-auto text-gray-300 hover:text-black transition-colors">
                    <Bookmark size={18} />
                </button>
            </div>
        </div>

        {/* LINHA SEPARADORA */}
        <div className="h-px bg-gray-100 w-full mt-8 mb-8" />
        
      </article>

      {/* MODAL DE COMENTÁRIOS */}
      <CommentsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        postId={post.id}
        currentUserAvatar={currentUserAvatar}
      />
    </>
  );
}