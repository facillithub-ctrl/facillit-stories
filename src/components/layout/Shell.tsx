"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { ContextBar } from "@/components/layout/ContextBar";
import { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

interface ShellProps {
  children: React.ReactNode;
  user: User | null;
  // A prop manual continua existindo para overrides, mas não é mais obrigatória
  showContextBar?: boolean;
}

export function Shell({ children, user, showContextBar = false }: ShellProps) {
  const pathname = usePathname();
  
  // Regra: Mostra ContextBar se for passado via prop OU se estiver na Home (Dashboard)
  const isDashboard = pathname === "/";
  const shouldShowContextBar = user && (showContextBar || isDashboard);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      
      {/* 1ª Coluna: Sidebar */}
      <Sidebar user={user} />
      
      {/* 3ª Coluna: ContextBar (Renderização Condicional) */}
      {shouldShowContextBar && <ContextBar />}

      {/* 2ª Coluna: Conteúdo Central */}
      <main 
        className={cn(
          "min-h-screen transition-all duration-300 flex flex-col relative z-0",
          user ? "lg:pl-64" : "w-full",
          shouldShowContextBar ? "xl:pr-80" : "" // Abre espaço para a 3ª coluna
        )}
      >
        {children}
      </main>
    </div>
  );
}