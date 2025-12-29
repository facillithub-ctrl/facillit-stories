"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Library, 
  MessageSquare, // Ícone de Mensagem
  Settings, 
  Sparkles, 
  LogOut, 
  Menu, 
  X, 
  ShieldAlert,
  Bell, 
  LucideIcon 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@supabase/supabase-js";

const ADMIN_ID = "06ba69b6-807c-45a5-aad9-2013fe6edf3e";

interface SidebarProps {
  user: User | null;
}

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  className?: string;
  onClick?: () => void;
}

export function Sidebar({ user }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  if (!user) return null;
  const isAdmin = user.id === ADMIN_ID;

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 z-40">
        <span className="font-bold text-lg text-brand-purple tracking-tight">Facillit.</span>
        <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="p-2 text-gray-600">
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsMobileOpen(false)} />
      )}

      <aside className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        
        {/* Header */}
        <div className="h-16 lg:h-20 flex items-center px-6 border-b border-gray-50">
           <div className="flex flex-col">
             <span className="font-bold text-xl text-brand-purple tracking-tight">Facillit<span className="text-brand-green">.</span></span>
             <span className="text-[10px] text-gray-400 font-bold tracking-[0.25em] uppercase mt-0.5">Stories</span>
           </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
          
          <div>
            <h3 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Principal</h3>
            <nav className="space-y-1">
              <NavItem href="/" icon={LayoutDashboard} label="Feed" isActive={pathname === "/"} onClick={() => setIsMobileOpen(false)} />
              <NavItem href="/notifications" icon={Bell} label="Notificações" isActive={pathname === "/notifications"} onClick={() => setIsMobileOpen(false)} />
              {/* NOVA OPÇÃO: MENSAGENS */}
              <NavItem href="/messages" icon={MessageSquare} label="Mensagens" isActive={pathname.startsWith("/messages")} onClick={() => setIsMobileOpen(false)} />
              <NavItem href="/library" icon={Library} label="Biblioteca" isActive={pathname === "/library"} onClick={() => setIsMobileOpen(false)} />
            </nav>
          </div>

          {isAdmin && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-500">
              <h3 className="px-3 text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2">Admin Zone <ShieldAlert size={10} /></h3>
              <NavItem href="/post-oficial" icon={ShieldAlert} label="Post Oficial" isActive={pathname === "/post-oficial"} onClick={() => setIsMobileOpen(false)} className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-100" />
            </div>
          )}

          {/* AI Section */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#F5F3FF] to-white border border-[#E9E5F3] shadow-sm cursor-pointer hover:shadow-md transition-all">
             <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-brand-purple" />
                <span className="text-xs font-bold text-gray-900">Facillit AI</span>
             </div>
             <p className="text-[11px] text-gray-500 mb-2 leading-snug">Seu copiloto literário para resumos e análises.</p>
          </div>

          <div>
            <h3 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Conta</h3>
            <nav className="space-y-1">
              <NavItem href="/settings" icon={Settings} label="Configurações" isActive={pathname === "/settings"} onClick={() => setIsMobileOpen(false)} />
            </nav>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-50 bg-white">
           <div className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all">
              <div className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-700 shrink-0 uppercase">
                 {user.email?.charAt(0)}
              </div>
              <div className="flex-1 overflow-hidden">
                 <p className="text-xs font-bold text-gray-900 truncate">Minha Conta</p>
                 <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
              </div>
              <Link href="/login" className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg transition-colors"><LogOut size={16} /></Link>
           </div>
        </div>

      </aside>
    </>
  );
}

function NavItem({ href, icon: Icon, label, isActive, className, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
        isActive ? "bg-brand-purple/5 text-brand-purple shadow-sm ring-1 ring-brand-purple/10" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
        className
      )}
    >
      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={cn("shrink-0", isActive && "text-brand-purple")} />
      <span className="truncate">{label}</span>
      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-purple rounded-r-full" />}
    </Link>
  );
}