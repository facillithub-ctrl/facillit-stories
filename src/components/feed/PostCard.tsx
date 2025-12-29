"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pin, ArrowRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { PostInteractions } from "./PostInteractions";

// Tipagem estrita alinhada com o DB
interface ProfileData {
  nickname: string | null;
  full_name: string | null;
  avatar_url: string | null;
  verification_badge: string | null;
}

export interface PostWithDetails {
  id: string;
  created_at: string;
  content: string;
  title: string | null;
  image_url: string | null;
  user_id: string;
  is_official: boolean;
  allow_comments: boolean;
  // Campos opcionais de CTA (adicionados na migration de posts oficiais)
  cta_label?: string | null;
  cta_url?: string | null;
  profiles: ProfileData | null;
  likes: { user_id: string }[];
  comments: { count: number }[];
}

interface PostCardProps {
  post: PostWithDetails;
  currentUserId: string;
  currentUserAvatar?: string | null;
  isExpanded?: boolean; // Se true, mostra texto completo sempre (página de detalhe)
}

export function PostCard({ post, currentUserId, currentUserAvatar, isExpanded = false }: PostCardProps) {
  // Lógica de "Ler Mais"
  const MAX_LENGTH = 280;
  const isLongText = post.content.length > MAX_LENGTH;
  const shouldTruncate = !isExpanded && isLongText;
  
  const displayContent = shouldTruncate 
    ? post.content.substring(0, MAX_LENGTH).trim() + "..." 
    : post.content;

  const author = post.profiles || { 
    nickname: "user", 
    full_name: "Usuário", 
    avatar_url: null, 
    verification_badge: null 
  };

  const initialLiked = post.likes ? post.likes.some((l) => l.user_id === currentUserId) : false;
  const initialLikesCount = post.likes ? post.likes.length : 0;
  const initialCommentsCount = post.comments?.[0]?.count || 0;

  return (
    <article 
        className={cn(
            "group relative transition-all duration-300 mb-8",
            isExpanded ? "bg-white" : "hover:bg-gray-50/50 p-4 -mx-4 rounded-3xl"
        )}
    >
        {/* Header do Post */}
        <div className="flex items-start gap-3 mb-4">
            <Link href={`/u/${author.nickname}`} className="block shrink-0 relative z-20">
                <div className={cn(
                    "w-11 h-11 rounded-full overflow-hidden relative border transition-colors",
                    post.is_official ? "border-brand-purple p-0.5" : "border-gray-100 group-hover:border-gray-200"
                )}>
                    <div className="w-full h-full rounded-full overflow-hidden relative bg-gray-50">
                        {author.avatar_url ? (
                            <Image src={author.avatar_url} alt={author.nickname || "User"} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-300">
                                {author.nickname?.[0]?.toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>
            </Link>

            <div className="flex flex-col pt-1">
                <div className="flex items-center gap-1.5 relative z-20">
                    <Link href={`/u/${author.nickname}`} className="text-sm font-bold text-gray-900 hover:text-brand-purple transition-colors">
                        {post.is_official ? "Equipe Facillit" : (author.full_name || author.nickname)}
                    </Link>
                    
                    {post.is_official && <Pin size={12} className="text-brand-purple fill-current" />}
                    <VerificationBadge badge={author.verification_badge} size="xs" />
                    
                    <span className="text-gray-300 text-[10px]">•</span>
                    <span className="text-[11px] text-gray-400 font-medium">
                        {new Date(post.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                    </span>
                </div>
                {post.title && !isExpanded && (
                    <Link href={`/post/${post.id}`} className="block">
                        <h2 className="text-base font-black text-gray-900 mt-0.5 leading-tight hover:underline decoration-gray-200 underline-offset-4">
                            {post.title}
                        </h2>
                    </Link>
                )}
            </div>
        </div>

        {/* Conteúdo Principal */}
        <div className={cn("space-y-4", !isExpanded && "sm:pl-14")}>
            
            {/* Título Expandido */}
            {post.title && isExpanded && (
                <h1 className="text-3xl font-black text-gray-900 leading-tight tracking-tight mb-4">
                    {post.title}
                </h1>
            )}

            {/* Texto */}
            <div className="relative">
                <p className={cn(
                    "text-gray-700 whitespace-pre-wrap font-normal font-sans leading-relaxed",
                    isExpanded ? "text-lg" : "text-[15px]"
                )}>
                    {displayContent}
                </p>
                
                {shouldTruncate && (
                    <Link 
                        href={`/post/${post.id}`} 
                        className="inline-flex items-center gap-1 mt-2 text-sm font-bold text-brand-purple hover:underline underline-offset-2"
                    >
                        Ler completo <ArrowRight size={14} />
                    </Link>
                )}
            </div>

            {/* Imagem / Mídia */}
            {post.image_url && (
                <div className={cn(
                    "relative w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm",
                    isExpanded ? "aspect-video" : "aspect-[2/1]"
                )}>
                    <Image src={post.image_url} alt="Mídia do Post" fill className="object-cover" />
                </div>
            )}

            {/* CTA Oficial (Apenas se existir link e label) */}
            {post.is_official && post.cta_url && post.cta_label && (
                <a 
                    href={post.cta_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-purple hover:scale-[1.02] transition-all shadow-lg shadow-gray-200"
                >
                    {post.cta_label} <ExternalLink size={12} />
                </a>
            )}

            {/* Barra de Interações */}
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