"use client"; // Necessário para o contador de letras em tempo real

import { useState } from "react";
import { createOfficialPost } from "./actions"; // Sua server action
import { ShieldAlert, Send, Image as ImageIcon, Type, MessageSquareOff } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar"; // Importe a sidebar se necessário no layout, ou use o Shell

// Mock do User para este exemplo (Na prática, venha via props ou contexto se usar client component puro)
// Como transformamos em Client Component para o contador, idealmente o Shell lidaria com o user.
// Mas para simplificar a cópia, vou assumir que você injetará isso no layout. 

export default function OfficialPostPage() {
  // Estado local apenas para UI (Contador e Toggle)
  const [charCount, setCharCount] = useState(0);
  const [commentsEnabled, setCommentsEnabled] = useState(true);

  return (
      <div className="max-w-3xl mx-auto p-8 font-sans">
            
            {/* Header Aviso */}
            <div className="bg-white border-l-4 border-red-500 pl-6 py-4 mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <ShieldAlert className="text-red-500" /> Post Oficial
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                    Publicação de alta prioridade. Notificará todos os usuários.
                </p>
            </div>

            <form action={createOfficialPost} className="space-y-8">
                
                {/* 1. Título (NOVO) */}
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                        <Type size={14} /> Título da Manchete
                    </label>
                    <input 
                        type="text" 
                        name="title"
                        placeholder="Ex: Novidades da Versão 2.0"
                        className="w-full text-3xl font-bold text-gray-900 placeholder-gray-300 border-b border-gray-100 py-2 focus:outline-none focus:border-black transition-colors"
                    />
                </div>

                {/* 2. Conteúdo com Contador */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Conteúdo</label>
                        <span className={`text-xs font-mono ${charCount > 500 ? 'text-orange-500' : 'text-gray-300'}`}>
                            {charCount} caracteres
                        </span>
                    </div>
                    <textarea 
                        name="content"
                        rows={10}
                        onChange={(e) => setCharCount(e.target.value.length)}
                        className="w-full text-lg leading-relaxed text-gray-800 placeholder-gray-300 resize-none border-none focus:outline-none p-0"
                        placeholder="Escreva sua mensagem oficial..."
                        required
                    />
                </div>

                {/* 3. Imagem de Capa (URL) */}
                <div className="p-4 border border-gray-100 rounded-xl flex items-center gap-4 bg-white hover:border-gray-300 transition-colors">
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                        <ImageIcon size={20} />
                    </div>
                    <input 
                        type="url" 
                        name="image_url"
                        placeholder="Cole a URL da imagem de capa (https://...)"
                        className="flex-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
                    />
                </div>

                {/* 4. Configurações (Comentários e Prioridade) */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                    
                    {/* Toggle Comentários */}
                    <label className="flex items-center gap-3 cursor-pointer group select-none">
                        <input 
                            type="checkbox" 
                            name="allow_comments" 
                            className="hidden" 
                            checked={commentsEnabled}
                            onChange={(e) => setCommentsEnabled(e.target.checked)}
                        />
                        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${commentsEnabled ? 'bg-black' : 'bg-gray-200'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${commentsEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                        <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            {commentsEnabled ? 'Comentários Ativados' : 'Comentários Desativados'}
                            {!commentsEnabled && <MessageSquareOff size={14} className="text-gray-400"/>}
                        </span>
                    </label>

                    {/* Botão Publicar */}
                    <button type="submit" className="px-8 py-3 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-all flex items-center gap-2 shadow-xl shadow-black/5">
                        <Send size={18} /> Publicar
                    </button>
                </div>
            </form>
      </div>
  );
}