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
  Sparkles, 
  LogOut, 
  Menu, 
  X, 
  ShieldAlert,
  LucideIcon 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@supabase/supabase-js";

// ID do Admin Supremo
const ADMIN_ID = "06ba69b6-807c-45a5-aad9-2013fe6edf3e";

interface SidebarProps {
  user: User | null; // Tipagem estrita do Supabase
}

// Interface para os itens de navegação (Zero any)
interface NavItemProps {
  href: string;
  icon: LucideIcon; // Tipo correto para ícones Lucide
  label: string;
  isActive?: boolean;
  className?: string;
  onClick?: () => void;
}

export function Sidebar({ user }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  // Se não houver usuário, a sidebar não renderiza (segurança visual)
  if (!user) return null;

  const isAdmin = user.id === ADMIN_ID;

  return (
    <>
      {/* --- MOBILE HEADER (Apenas < 1024px) --- */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-50">
        <span className="font-bold text-lg text-brand-purple tracking-tight">
          Facillit<span className="text-brand-green">.</span>
        </span>
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)} 
          className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* --- MOBILE OVERLAY --- */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm transition-opacity" 
          onClick={() => setIsMobileOpen(false)} 
        />
      )}

      {/* --- SIDEBAR PRINCIPAL (Fixa no Desktop / Drawer no Mobile) --- */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none",
          // Lógica de visibilidade:
          // Mobile: Escondida (-translate-x) a menos que aberta
          // Desktop: Sempre visível (translate-x-0)
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        
        {/* 1. Header da Marca */}
        <div className="h-16 lg:h-20 flex items-center px-6 border-b border-gray-50">
           <div className="flex flex-col">
             <span className="font-bold text-xl text-brand-purple tracking-tight">
               Facillit<span className="text-brand-green">.</span>
             </span>
             <span className="text-[10px] text-gray-400 font-bold tracking-[0.25em] uppercase mt-0.5">
               Stories
             </span>
           </div>
        </div>

        {/* 2. Área de Navegação (Scrollável) */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
          
          {/* SEÇÃO: PRINCIPAL */}
          <div>
            <h3 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Principal
            </h3>
            <nav className="space-y-1">
              <NavItem 
                href="/" 
                icon={LayoutDashboard} 
                label="Feed" 
                isActive={pathname === "/"} 
                onClick={() => setIsMobileOpen(false)}
              />
              <NavItem 
                href="/library" 
                icon={Library} 
                label="Biblioteca" 
                isActive={pathname === "/library"} 
                onClick={() => setIsMobileOpen(false)}
              />
            </nav>
          </div>

          {/* SEÇÃO: ADMIN (Condicional) */}
          {isAdmin && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-500">
              <h3 className="px-3 text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                 Admin Zone <ShieldAlert size={10} />
              </h3>
              <NavItem 
                href="/post-oficial" 
                icon={ShieldAlert} 
                label="Post Oficial" 
                isActive={pathname === "/post-oficial"} 
                onClick={() => setIsMobileOpen(false)}
                className="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border border-red-100"
              />
            </div>
          )}

          {/* CARD: FACILLIT AI */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#F5F3FF] to-white border border-[#E9E5F3] shadow-sm group cursor-pointer hover:border-brand-purple/30 transition-all">
             <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-white rounded-md shadow-sm text-brand-purple">
                   <Sparkles size={14} />
                </div>
                <span className="text-xs font-bold text-gray-900 group-hover:text-brand-purple transition-colors">
                  Facillit AI
                </span>
             </div>
             <p className="text-[11px] text-gray-500 leading-relaxed mb-3">
               Descubra conexões profundas nas suas leituras.
             </p>
             <div className="text-[10px] font-bold text-brand-purple flex items-center gap-1 group-hover:translate-x-1 transition-transform">
               Explorar Beta <ChevronRight size={10} />
             </div>
          </div>

          {/* SEÇÃO: COMUNIDADE */}
          <div>
            <h3 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Comunidade
            </h3>
            <nav className="space-y-1">
              <NavItem 
                href="/forums" 
                icon={MessageSquare} 
                label="Fóruns" 
                isActive={pathname.startsWith("/forums")} 
                onClick={() => setIsMobileOpen(false)}
              />
              <NavItem 
                href="/clubs" 
                icon={Users} 
                label="Clubes" 
                isActive={pathname.startsWith("/clubs")} 
                onClick={() => setIsMobileOpen(false)}
              />
            </nav>
          </div>

          {/* SEÇÃO: CONTA */}
          <div>
            <h3 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Conta
            </h3>
            <nav className="space-y-1">
              <NavItem 
                href="/settings" 
                icon={Settings} 
                label="Configurações" 
                isActive={pathname === "/settings"} 
                onClick={() => setIsMobileOpen(false)}
              />
            </nav>
          </div>

        </div>

        {/* 3. Footer (Usuário + Sair) */}
        <div className="p-4 border-t border-gray-50 bg-white">
           <div className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all cursor-default">
              
              {/* Avatar Mini */}
              <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-700 shrink-0">
                 {user.email?.charAt(0).toUpperCase()}
              </div>
              
              <div className="flex-1 overflow-hidden">
                 <p className="text-xs font-bold text-gray-900 truncate">Minha Conta</p>
                 <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
              </div>

              <Link 
                href="/login" 
                title="Sair"
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={16} />
              </Link>
           </div>
        </div>

      </aside>
    </>
  );
}

// --- SUBCOMPONENTE DE ITEM DE NAVEGAÇÃO (TIPADO) ---
function NavItem({ href, icon: Icon, label, isActive, className, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
        isActive 
          ? "bg-brand-purple/5 text-brand-purple shadow-sm ring-1 ring-brand-purple/10" 
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
        className
      )}
    >
      <Icon 
        size={18} 
        strokeWidth={isActive ? 2.5 : 2} 
        className={cn("shrink-0", isActive && "text-brand-purple")}
      />
      <span className="truncate">{label}</span>
      
      {/* Indicador de Ativo (Barra lateral sutil) */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-purple rounded-r-full" />
      )}
    </Link>
  );
}

// Icon auxiliar para o card de AI
function ChevronRight({ size, className }: { size?: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}