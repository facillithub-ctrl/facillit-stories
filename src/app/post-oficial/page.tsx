"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { User } from "@supabase/supabase-js";
import { ShieldAlert, Send, Image as ImageIcon, Layout, ExternalLink, Hash, CheckCircle2 } from "lucide-react";
import { Shell } from "@/components/layout/Shell";
import { createOfficialPost } from "./actions";
import { cn } from "@/lib/utils";

export default function OfficialPostPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados do Formulário
  const [charCount, setCharCount] = useState(0);
  const [ctaType, setCtaType] = useState("none");
  const [isSubmitting, setIsSubmitting] = useState(false); // Para feedback visual (loading no botão)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function getUser() {
        const { data } = await supabase.auth.getUser();
        setUser(data.user);
        setLoading(false);
    }
    getUser();
  }, []);

  // Opções de Call to Action
  const CTA_OPTIONS = [
    { id: "none", label: "Sem Ação", icon: <Hash size={14}/> },
    { id: "blog", label: "Veja no Blog", icon: <Layout size={14}/> },
    { id: "read", label: "Leia Completo", icon: <ExternalLink size={14}/> },
    { id: "watch", label: "Assista Agora", icon: <ExternalLink size={14}/> },
  ];

  // Se estiver carregando o user, mostramos um shell vazio ou loading spinner
  // Para evitar o "flicker" ou erro de prop undefined no Shell
  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-white">
              <div className="w-6 h-6 border-2 border-gray-100 border-t-black rounded-full animate-spin" />
          </div>
      );
  }

  return (
    <Shell user={user}>
      {/* WRAPPER DE LAYOUT:
         pt-24: Espaço para header mobile se houver
         lg:pt-12: Espaço desktop
         px-6: Margens laterais
         max-w-3xl mx-auto: Centraliza e limita largura (evita o aspecto "quebrado/esticado")
      */}
      <div className="w-full max-w-3xl mx-auto pt-24 lg:pt-12 px-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header da Página */}
        <header className="mb-12 border-b border-gray-50 pb-8">
            <div className="flex items-center gap-2 text-red-500 mb-4 bg-red-50 w-fit px-3 py-1 rounded-full border border-red-100">
                <ShieldAlert size={14} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Painel Administrativo</span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter sm:text-5xl">
                Criar Post Oficial
            </h1>
            <p className="text-gray-400 mt-3 text-sm font-medium leading-relaxed max-w-lg">
                Publicações oficiais ganham destaque visual, são fixadas no topo do feed e enviam notificações push para a base de usuários.
            </p>
        </header>

        {/* Formulário */}
        <form 
            action={(formData) => {
                setIsSubmitting(true);
                createOfficialPost(formData).finally(() => setIsSubmitting(false));
            }} 
            className="space-y-10"
        >
            {/* 1. Título */}
            <div className="group space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-focus-within:text-black transition-colors">
                    Manchete Principal
                </label>
                <input 
                    name="title"
                    type="text" 
                    placeholder="Ex: Chegou a Versão 2.0 do Facillit"
                    className="w-full text-3xl font-bold text-gray-900 placeholder-gray-200 border-none border-b border-transparent focus:border-gray-100 focus:ring-0 p-0 transition-all bg-transparent"
                    required
                />
            </div>

            {/* 2. Conteúdo */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Corpo da Mensagem
                    </label>
                    <span className={cn("text-[10px] font-mono font-bold transition-colors", charCount > 1500 ? "text-red-500" : "text-gray-200")}>
                        {charCount} / 2000
                    </span>
                </div>
                <textarea 
                    name="content"
                    rows={10}
                    onChange={(e) => setCharCount(e.target.value.length)}
                    className="w-full text-lg leading-relaxed text-gray-700 placeholder-gray-200 border-none focus:ring-0 p-0 resize-none font-serif bg-transparent"
                    placeholder="Escreva o comunicado oficial aqui..."
                    required
                />
            </div>

            {/* 3. Mídia e CTA (Grid 2 colunas) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-gray-50">
                {/* Imagem de Capa */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Imagem de Capa (URL)
                    </label>
                    <div className="relative group bg-gray-50 rounded-2xl transition-colors hover:bg-white hover:shadow-lg hover:shadow-gray-100/50 border border-transparent hover:border-gray-100">
                        <div className="absolute inset-y-0 left-4 flex items-center text-gray-300 group-focus-within:text-brand-purple transition-colors">
                            <ImageIcon size={18} />
                        </div>
                        <input 
                            name="image_url"
                            type="url" 
                            placeholder="https://..."
                            className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-sm focus:ring-0 text-gray-700 placeholder-gray-400"
                        />
                    </div>
                </div>

                {/* Seletor de CTA */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Botão de Ação
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {CTA_OPTIONS.map((opt) => (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => setCtaType(opt.id)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap border transition-all",
                                    ctaType === opt.id 
                                        ? "bg-black text-white border-black shadow-md" 
                                        : "bg-white text-gray-400 border-gray-100 hover:border-gray-300 hover:text-gray-600"
                                )}
                            >
                                {opt.icon} {opt.label}
                            </button>
                        ))}
                    </div>
                    
                    {/* Input condicional de URL do CTA */}
                    {ctaType !== 'none' && (
                        <div className="animate-in fade-in slide-in-from-top-1">
                            <input 
                                name="cta_url"
                                type="url"
                                placeholder="Link de destino do botão..."
                                className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-xs focus:ring-1 focus:ring-black/10 focus:bg-white transition-all"
                                required
                            />
                        </div>
                    )}
                    {/* Campo oculto para enviar o label ao server action */}
                    <input type="hidden" name="cta_label" value={CTA_OPTIONS.find(o => o.id === ctaType)?.label || ""} />
                </div>
            </div>

            {/* Footer de Ações */}
            <div className="pt-8 flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer group select-none">
                    <div className="relative">
                        <input type="checkbox" name="allow_comments" defaultChecked className="peer sr-only" />
                        <div className="w-5 h-5 border-2 border-gray-200 rounded-md peer-checked:bg-black peer-checked:border-black transition-colors" />
                        <CheckCircle2 size={12} className="absolute top-1 left-1 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                    </div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-gray-600 transition-colors">
                        Permitir Comentários
                    </span>
                </label>

                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-black text-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-[0.2em] hover:bg-gray-800 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-xl shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Send size={16} />
                    )}
                    {isSubmitting ? "Publicando..." : "Publicar"}
                </button>
            </div>
        </form>
      </div>
    </Shell>
  );
}