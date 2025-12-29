"use client";

import Image from "next/image";
import Link from "next/link";
import { Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { PostInteractions } from "./PostInteractions";

export interface PostWithDetails {
  id: string;
  created_at: string;
  content: string;
  title: string | null;
  image_url: string | null;
  user_id: string;
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
  isExpanded?: boolean;
}

export function PostCard({ post, currentUserId, currentUserAvatar, isExpanded = false }: PostCardProps) {
  const author = post.profiles || { nickname: "user", full_name: "Usuário", avatar_url: null, verification_badge: null };
  const isOfficial = post.is_official;
  const initialLiked = post.likes ? post.likes.some((l) => l.user_id === currentUserId) : false;
  const initialLikesCount = post.likes ? post.likes.length : 0;
  const initialCommentsCount = post.comments?.[0]?.count || 0;

  return (
    <article className={cn("group relative", isExpanded ? "bg-white" : "bg-transparent")}>
        
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
            <Link href={isOfficial ? '#' : `/u/${author.nickname}`} className="block shrink-0 relative z-20">
                <div className={cn(
                    "w-10 h-10 rounded-full overflow-hidden relative border",
                    isOfficial ? "border-[#42047e]" : "border-transparent"
                )}>
                    {author.avatar_url ? (
                        <Image src={author.avatar_url} alt={author.nickname || "User"} fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full bg-[#42047e]/10 flex items-center justify-center text-xs font-bold text-[#42047e]">
                            {author.nickname?.[0]?.toUpperCase()}
                        </div>
                    )}
                </div>
            </Link>

            <div className="flex flex-col">
                <div className="flex items-center gap-1.5 relative z-20">
                    <Link href={isOfficial ? '#' : `/u/${author.nickname}`} className="text-sm font-bold text-gray-900 hover:text-[#42047e] transition-colors">
                        {isOfficial ? "Equipe Facillit" : (author.full_name || author.nickname)}
                    </Link>
                    {isOfficial && <Pin size={12} className="text-[#42047e] fill-current" />}
                    <VerificationBadge badge={author.verification_badge} size="sm" />
                    <span className="text-gray-300 text-xs">•</span>
                    <span className="text-xs text-gray-400">
                        {new Date(post.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                    </span>
                </div>
                {post.title && !isExpanded && (
                    <h2 className="text-base font-bold text-gray-900 mt-0.5">{post.title}</h2>
                )}
            </div>
        </div>

        {/* Content */}
        <div className={cn("pl-0", !isExpanded && "sm:pl-14")}>
            {post.title && isExpanded && (
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h2>
            )}

            <p className={cn(
                "text-gray-800 whitespace-pre-wrap font-normal mb-4 font-sans leading-relaxed",
                isExpanded ? "text-lg" : "text-[15px]"
            )}>
                {post.content}
            </p>

            {post.image_url && (
                <div className={cn(
                    "relative w-full rounded-xl overflow-hidden mb-4 bg-gray-50 border border-gray-100",
                    isExpanded ? "aspect-video" : "aspect-[4/3] sm:aspect-video"
                )}>
                    <Image src={post.image_url} alt="Post" fill className="object-cover" />
                </div>
            )}

            {/* Interactions */}
            <PostInteractions 
                postId={post.id}
                postOwnerId={post.user_id}
                currentUserId={currentUserId}
                currentUserAvatar={currentUserAvatar}
                initialLikesCount={initialLikesCount}
                initialCommentsCount={initialCommentsCount}
                initialIsLiked={initialLiked}
                allowComments={post.allow_comments}
            />
        </div>
    </article>
  );
}