"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { ContextBar } from "@/components/layout/ContextBar";
import { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

interface ShellProps {
  children: React.ReactNode;
  user: User | null;
  // Mantemos a prop opcional para forçar a exibição se necessário (ex: página de perfil)
  showContextBar?: boolean;
}

export function Shell({ children, user, showContextBar }: ShellProps) {
  const pathname = usePathname();
  
  // REGRA DE OURO: Mostra a ContextBar se:
  // 1. Foi forçado via prop (showContextBar={true})
  // 2. OU se estamos na raiz (Dashboard) "/"
  const isDashboard = pathname === "/";
  const shouldShowContextBar = user && (showContextBar === true || isDashboard);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      
      {/* 1. Sidebar (Esquerda) - Só renderiza se tiver user */}
      <Sidebar user={user} />
      
      {/* 3. ContextBar (Direita) - Renderização Condicional Inteligente */}
      {shouldShowContextBar && <ContextBar />}

      {/* 2. Conteúdo Central (Meio) */}
      <main 
        className={cn(
          "min-h-screen transition-all duration-300 flex flex-col relative z-0",
          // Se tem usuário, empurra conteúdo para a direita para não ficar baixo da Sidebar
          user ? "lg:pl-64" : "w-full",
          // Se tem ContextBar, empurra conteúdo para a esquerda (em telas grandes)
          shouldShowContextBar ? "xl:pr-80" : "" 
        )}
      >
        {children}
      </main>
    </div>
  );
}