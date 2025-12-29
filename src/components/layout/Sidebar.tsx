"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Library, 
  MessageSquare, 
  Users, 
  Settings, 
  Sparkles,
  BookOpen,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@supabase/supabase-js"; // Tipo do usuário

// Definição das Categorias de Navegação
const MENU_SECTIONS = [
  {
    category: "Principal",
    items: [
      { label: "Feed", href: "/", icon: LayoutDashboard },
      { label: "Minha Biblioteca", href: "/library", icon: Library },
    ]
  },
  {
    category: "Comunidade",
    items: [
      { label: "Fóruns", href: "/forums", icon: MessageSquare },
      { label: "Clubes de Leitura", href: "/clubs", icon: Users },
    ]
  },
  {
    category: "Conta",
    items: [
      { label: "Configurações", href: "/settings", icon: Settings },
    ]
  }
];

interface SidebarProps {
  user?: User | null; // Recebe o usuário para decidir se renderiza
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  // REGRA DE OURO: Se não tem usuário, não mostra a sidebar.
  if (!user) return null;

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col">
      
      {/* 1. Header da Marca */}
      <div className="h-16 flex items-center px-6 border-b border-gray-50">
        <div className="flex flex-col">
          <span className="font-bold text-lg text-brand-purple tracking-tight">
            Facillit<span className="text-brand-green">.</span>
          </span>
          <span className="text-[9px] text-gray-400 font-bold tracking-[0.25em] uppercase">
            Stories
          </span>
        </div>
      </div>

      {/* 2. Navegação Categorizada */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
        {MENU_SECTIONS.map((section) => (
          <div key={section.category}>
            <h3 className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              {section.category}
            </h3>
            <nav className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive 
                        ? "bg-brand-purple/5 text-brand-purple" 
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon 
                      size={18} 
                      className={cn(isActive && "text-brand-purple")}
                      strokeWidth={isActive ? 2.5 : 2} 
                    />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}

        {/* 3. Card de Incentivo (IA / Feature) */}
        <div className="mt-8 mx-1 p-4 rounded-xl bg-gradient-to-br from-brand-purple/5 to-transparent border border-brand-purple/10">
          <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
             <Sparkles size={14} className="text-brand-purple" />
          </div>
          <h4 className="text-sm font-bold text-gray-900 mb-1">Facillit AI</h4>
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">
            Obtenha análises profundas das suas leituras atuais.
          </p>
          <button className="text-xs font-semibold text-brand-purple hover:underline">
            Explorar →
          </button>
        </div>
      </div>

      {/* 4. Footer User Info (Minimalista) */}
      <div className="p-4 border-t border-gray-50 bg-white">
        <div className="flex items-center gap-3 p-2 rounded-lg border border-gray-100 shadow-sm">
           <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs">
              {user.email?.charAt(0).toUpperCase()}
           </div>
           <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold text-gray-900 truncate">Minha Conta</p>
              <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
           </div>
           <Link href="/login" title="Sair" className="text-gray-400 hover:text-red-500 transition-colors">
              <LogOut size={14} />
           </Link>
        </div>
      </div>

    </aside>
  );
}