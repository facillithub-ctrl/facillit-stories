"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Library, 
  MessageSquare, 
  Users, 
  Settings, 
  Menu, 
  X, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

// Itens de navegação atualizados
const NAV_ITEMS = [
  { label: "Feed", href: "/", icon: LayoutDashboard, active: true },
  { label: "Biblioteca", href: "/library", icon: Library, active: false, status: "Em breve" },
  { label: "Fóruns", href: "/forums", icon: MessageSquare, active: false, status: "Em breve" },
  { label: "Clubes", href: "/clubs", icon: Users, active: false, status: "Em breve" },
  // Configurações agora é ativo e leva para a página correta
  { label: "Configurações", href: "/settings", icon: Settings, active: true },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Trigger */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 bg-white rounded-md shadow-sm border border-gray-200 text-brand-purple hover:bg-gray-50 transition-colors"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Overlay Mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 bg-white border-r border-gray-100 transition-all duration-300 ease-in-out flex flex-col",
          isMobileOpen ? "translate-x-0 w-72 shadow-2xl" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-20" : "lg:w-64"
        )}
      >
        {/* Header / Logo */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-gray-50">
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-xl text-brand-purple tracking-tight">
                Facillit<span className="text-brand-green">.</span>
              </span>
              <span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">Stories</span>
            </div>
          )}
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-full hover:bg-brand-purple/5 text-gray-400 hover:text-brand-purple transition-colors"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-8 px-4 space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.active ? item.href : "#"}
                className={cn(
                  "flex items-center gap-4 px-3 py-3 rounded-lg text-sm font-medium transition-all group relative",
                  // Lógica de Cores da Marca
                  isActive 
                    ? "bg-brand-purple/10 text-brand-purple shadow-sm ring-1 ring-brand-purple/20" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
                  !item.active && "opacity-60 cursor-not-allowed"
                )}
                onClick={() => setIsMobileOpen(false)}
              >
                <item.icon 
                  size={22} 
                  strokeWidth={isActive ? 2.5 : 2}
                  className={cn(isActive && "text-brand-purple")} 
                />
                
                {!isCollapsed && (
                  <span className="flex-1 truncate">{item.label}</span>
                )}

                {!isCollapsed && item.status && (
                  <span className="text-[10px] uppercase tracking-wider font-bold text-brand-purple/60 bg-brand-purple/5 px-2 py-0.5 rounded-full">
                    Breve
                  </span>
                )}
                
                {/* Indicador lateral ativo */}
                {isActive && !isCollapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-brand-gradient rounded-r-full" />
                )}

                {/* Tooltip Collapsed */}
                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-3 py-1.5 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer User Area */}
        <div className="p-4 border-t border-gray-50">
           {/* Link rápido para o Perfil do usuário logado (Placeholder por enquanto) */}
            <Link 
              href="/u/me" 
              className={cn(
                "flex items-center gap-3 w-full p-2 mb-2 rounded-lg hover:bg-gray-50 transition-colors",
                isCollapsed && "justify-center"
              )}
            >
              <div className="w-8 h-8 rounded-full bg-brand-gradient p-[2px]">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  <UserCircle size={16} className="text-brand-purple" />
                </div>
              </div>
              {!isCollapsed && (
                <div className="flex flex-col text-left">
                  <span className="text-sm font-medium text-gray-900">Meu Perfil</span>
                  <span className="text-xs text-gray-400">Ver público</span>
                </div>
              )}
            </Link>

          <Link href="/login" className={cn(
            "flex items-center gap-3 w-full p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors",
            isCollapsed && "justify-center"
          )}>
            <LogOut size={20} />
            {!isCollapsed && <span className="text-sm font-medium">Sair</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}