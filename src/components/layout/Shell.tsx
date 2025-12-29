"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { ContextBar } from "@/components/layout/ContextBar";
import { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

interface ShellProps {
  children: React.ReactNode;
  user: User | null;
  showContextBar?: boolean; // Nova prop para controlar a 3ª coluna
}

export function Shell({ children, user, showContextBar = false }: ShellProps) {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      
      {/* 1ª Coluna: Sidebar (Esquerda) */}
      <Sidebar user={user} />
      
      {/* 3ª Coluna: ContextBar (Direita) - Renderizada apenas se solicitada */}
      {user && showContextBar && <ContextBar />}

      {/* 2ª Coluna: Conteúdo Central */}
      <main 
        className={cn(
          "min-h-screen transition-all duration-300 flex flex-col relative z-0",
          user ? "lg:pl-64" : "w-full",
          user && showContextBar ? "xl:pr-80" : "" // Adiciona espaço para ContextBar em telas grandes
        )}
      >
        {children}
      </main>
    </div>
  );
}