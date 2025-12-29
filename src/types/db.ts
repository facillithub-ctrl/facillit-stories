// Definições de Perfil (Profile)
export interface Profile {
  id: string;
  nickname: string | null;
  full_name: string | null;
  avatar_url: string | null;
  verification_badge: string | null;
  bio?: string | null;
}

// Definições para Notificações
export interface NotificationActor {
  nickname: string | null;
  avatar_url: string | null;
}

export interface NotificationItem {
  id: string;
  created_at: string;
  type: 'like_post' | 'like_comment' | 'reply_comment' | 'mention' | 'follow';
  read: boolean;
  resource_id: string | null;
  actor_id: string;
  recipient_id: string;
  actor: NotificationActor | null; // Pode ser null se user for deletado
}

export type NotificationTab = 'all' | 'likes' | 'comments';

export interface TabConfig {
  id: NotificationTab;
  label: string;
}

// Definições para Comentários (Aqui está a interface que faltava)
export interface CommentWithProfile {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  post_id: string;
  profiles: Profile | null;
  comment_likes: { user_id: string }[];
}

// Definições para Posts
export interface PostData {
  id: string;
  created_at: string;
  content: string;
  title: string | null;
  image_url: string | null;
  user_id: string;
  is_official: boolean;
  allow_comments: boolean;
  priority_level?: number;
  profiles: Profile | null;
  likes: { user_id: string }[];
  comments: { count: number }[];
}