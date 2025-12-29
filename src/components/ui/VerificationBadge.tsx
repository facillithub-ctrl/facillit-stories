import React from 'react';
import { BadgeCheck, CheckCircle2, Star, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerificationBadgeProps {
  badge: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// 1. Definição Visual dos Badges
const BADGE_TYPES = {
  identity: { // Azul - Identidade Verificada
    color: 'text-blue-500',
    icon: BadgeCheck,
    tooltip: 'Identidade Verificada',
  },
  educator: { // Verde - Professor/Educador
    color: 'text-brand-green', // Usando cor da marca
    icon: ShieldCheck,
    tooltip: 'Educador Verificado',
  },
  official: { // Dourado - Oficial/Autor
    color: 'text-yellow-500',
    icon: Star, // Star preenchida visualmente via fill
    tooltip: 'Conta Oficial',
  },
  featured: { // Vermelho - Destaque
    color: 'text-red-500',
    icon: BadgeCheck,
    tooltip: 'Destaque',
  },
  legacy: { // Roxo - Legado
    color: 'text-purple-500',
    icon: CheckCircle2,
    tooltip: 'Usuário Legado',
  },
} as const;

// 2. Mapa de Aliases (Compatibilidade com o Banco do Hub)
const BADGE_ALIASES: Record<string, keyof typeof BADGE_TYPES> = {
  // Aliases diretos
  'identity': 'identity',
  'educator': 'educator',
  'official': 'official',
  'featured': 'featured',
  'legacy': 'legacy',
  // Aliases de cores (legado do sistema antigo)
  'blue': 'identity',
  'verified': 'identity',
  'green': 'educator',
  'red': 'featured',
  'gold': 'official',
  'admin': 'official',
  'purple': 'legacy',
};

export const VerificationBadge = ({ badge, size = 'md', className }: VerificationBadgeProps) => {
  if (!badge) return null;

  // Normaliza a chave
  const normalizedKey = badge.toLowerCase().trim();
  const primaryKey = BADGE_ALIASES[normalizedKey];

  if (!primaryKey) return null;

  const details = BADGE_TYPES[primaryKey];
  const IconComponent = details.icon;

  // Tamanhos (Ajuste fino para alinhar com texto)
  const sizeClasses = {
    'sm': 'w-3 h-3',
    'md': 'w-5 h-5', // Padrão para nomes de perfil
    'lg': 'w-6 h-6',
  };

  return (
    <div 
      className={cn("inline-flex items-center justify-center ml-1", className)}
      title={details.tooltip}
    >
      <IconComponent 
        className={cn(details.color, sizeClasses[size], "fill-current text-white")}
        // fill-current + text-color cria o efeito de ícone sólido com check vazado se usar BadgeCheck
        strokeWidth={2.5}
        // Hack visual para o BadgeCheck parecer preenchido:
        // Na verdade, usamos a cor no 'text' (stroke) ou 'fill' dependendo do icone.
        // Para simplificar e ficar bonito no Clean White:
        style={{ fill: 'currentColor', color: 'white' }} 
        // O stroke será branco, o fill será a cor do badge.
      />
      {/* Ajuste para ícones que não suportam fill da mesma forma, ou usar SVG custom se preferir */}
      <IconComponent className={cn("absolute", details.color, sizeClasses[size])} strokeWidth={1.5} />
    </div>
  );
};