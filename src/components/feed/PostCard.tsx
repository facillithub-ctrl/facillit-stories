"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MessageSquare, Bookmark, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleLike } from "@/actions/interactions";
import { CommentsModal } from "./CommentsModal";
import { VerificationBadge } from "@/components/ui/VerificationBadge";

// Tipos para evitar 'any'
export interface PostWithDetails {
  id: string;
  created_at: string;
  content: string;
  title: string | null;
  image_url: string | null;
  is_official: boolean;
  allow_comments: boolean;
  profiles: {
    nickname: string | null;
    full_name: string | null;
    avatar_url: string | null;
    verification_badge: string | null;
  } | null;
  likes: { user_id: string }[];
  comments: { count: number }[];
}

interface PostCardProps {
  post: PostWithDetails;
  currentUserId: string;
  currentUserAvatar?: string | null;
}

export function PostCard({ post, currentUserId, currentUserAvatar }: PostCardProps) {
  const author = post.profiles || { nickname: "unknown", full_name: "Usuário", avatar_url: null, verification_badge: null };
  const isOfficial = post.is_official;
  
  const initialLiked = post.likes ? post.likes.some((l) => l.user_id === currentUserId) : false;
  const initialLikesCount = post.likes ? post.likes.length : 0;

  const [isLiked, setIsLiked] = useState<boolean>(initialLiked);
  const [likesCount, setLikesCount] = useState<number>(initialLikesCount);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const commentsCount = post.comments?.[0]?.count || 0;

  async function handleLike() {
    const newState = !isLiked;
    setIsLiked(newState);
    setLikesCount((prev) => (newState ? prev + 1 : prev - 1));
    await toggleLike(post.id, currentUserId);
  }

  return (
    <>
      <article className="group relative bg-white transition-colors">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
            <Link href={isOfficial ? '#' : `/u/${author.nickname}`} className="block shrink-0">
                <div className={cn(
                    "w-9 h-9 rounded-full overflow-hidden relative border shadow-sm transition-transform hover:scale-105",
                    isOfficial ? "border-transparent ring-2 ring-brand-purple/20" : "border-gray-100"
                )}>
                    {isOfficial ? (
                        <div className="w-full h-full bg-brand-gradient flex items-center justify-center text-white text-[9px] font-bold">FS</div>
                    ) : author.avatar_url ? (
                        <Image src={author.avatar_url} alt={author.nickname || "User"} fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gray-50 flex items-center justify-center text-[10px] text-gray-400 font-bold">
                            {author.nickname?.[0]?.toUpperCase()}
                        </div>
                    )}
                </div>
            </Link>

            <div className="flex flex-col leading-tight">
                <div className="flex items-center gap-1.5">
                    <Link href={isOfficial ? '#' : `/u/${author.nickname}`} className="text-[13px] font-bold text-gray-900 hover:text-brand-purple transition-colors">
                        {isOfficial ? "Equipe Facillit Stories" : (author.full_name || author.nickname)}
                    </Link>
                    
                    {isOfficial && <Pin size={10} className="text-brand-purple fill-current" />}
                    <VerificationBadge badge={author.verification_badge} size="sm" />
                </div>
                <span className="text-[11px] text-gray-400 font-medium">
                    {new Date(post.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                </span>
            </div>
        </div>

        {/* Content */}
        <div className="pl-0 sm:pl-12">
            
            {post.title && (
                <h2 className="text-lg font-bold text-gray-900 mb-2 leading-tight tracking-tight">
                    {post.title}
                </h2>
            )}

            <p className="text-[14px] sm:text-[15px] leading-relaxed text-gray-800 whitespace-pre-wrap font-normal mb-4 font-sans">
                {post.content}
            </p>

            {post.image_url && (
                <div className="relative w-full h-72 sm:h-80 rounded-lg overflow-hidden border border-gray-100 mb-4 bg-gray-50 group-hover:border-gray-200 transition-colors">
                    <Image src={post.image_url} alt="Post content" fill className="object-cover" />
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-6 pt-1 border-t border-transparent group-hover:border-gray-50 transition-colors">
                <button onClick={handleLike} className="flex items-center gap-1.5 group/btn py-1">
                    <Heart 
                        size={18} 
                        className={cn(
                            "transition-all duration-300 group-active/btn:scale-90",
                            isLiked ? "fill-red-500 text-red-500" : "text-gray-400 group-hover/btn:text-red-500"
                        )} 
                    />
                    <span className={cn("text-xs font-semibold", isLiked ? "text-red-600" : "text-gray-500")}>
                        {likesCount || ""}
                    </span>
                </button>

                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-1.5 group/btn py-1"
                    disabled={!post.allow_comments}
                >
                    <MessageSquare size={18} className="text-gray-400 group-hover/btn:text-brand-purple transition-colors" />
                    <span className="text-xs font-semibold text-gray-500 group-hover/btn:text-brand-purple">
                        {commentsCount > 0 ? commentsCount : ""}
                    </span>
                </button>

                <button className="ml-auto text-gray-300 hover:text-black transition-colors">
                    <Bookmark size={18} />
                </button>
            </div>
        </div>

        <div className="h-px bg-gray-100 w-full mt-6 mb-6" />
        
      </article>

      <CommentsModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        postId={post.id}
        currentUserId={currentUserId}
        currentUserAvatar={currentUserAvatar}
      />
    </>
  );
}