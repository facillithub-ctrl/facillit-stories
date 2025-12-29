// Definições exatas do que vem do banco de dados
export interface Profile {
  id: string;
  nickname: string | null;
  full_name: string | null;
  avatar_url: string | null;
  verification_badge: string | null;
  bio?: string | null;
}

export interface NotificationActor {
  nickname: string | null;
  avatar_url: string | null;
}

// Tipo exato para o retorno do join do Supabase
export interface NotificationItem {
  id: string;
  created_at: string;
  type: 'like_post' | 'like_comment' | 'reply_comment' | 'mention' | 'follow';
  read: boolean;
  resource_id: string | null;
  actor_id: string;
  recipient_id: string;
  actor: NotificationActor | null; // Pode vir nulo se o usuário foi deletado
}

// Tipagem para as Abas (evita o uso de string genérica)
export type NotificationTab = 'all' | 'likes' | 'comments';

export interface TabConfig {
  id: NotificationTab;
  label: string;
}