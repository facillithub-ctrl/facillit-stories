"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

interface ShellProps {
  children: React.ReactNode;
  user: User | null;
}

export function Shell({ children, user }: ShellProps) {
  // Lógica:
  // Se tem usuário -> Mostra Sidebar + Adiciona Padding (lg:pl-64)
  // Se não tem usuário -> Esconde Sidebar + Largura Total (w-full)
  
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      
      {/* Sidebar renderiza internamente sua lógica de mobile/desktop */}
      <Sidebar user={user} />
      
      <main 
        className={cn(
          "min-h-screen transition-all duration-300 flex flex-col",
          user ? "lg:pl-64" : "w-full"
        )}
      >
        {children}
      </main>
    </div>
  );
}