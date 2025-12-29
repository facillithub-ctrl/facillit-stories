"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Plus, 
  Type, 
  Image as ImageIcon, 
  FileText, 
  BarChart2, 
  ChevronDown 
} from "lucide-react";
import Link from "next/link";

export function CreatePostButton() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = [
    { label: "Postagem Rápida", icon: Type, href: "/post-oficial", desc: "Compartilhe um pensamento" }, // Link temporário, ideal abrir modal
    { label: "Mídia", icon: ImageIcon, href: "#", desc: "Fotos e vídeos" },
    { label: "Artigo", icon: FileText, href: "#", desc: "Conteúdo longo e formatado" },
    { label: "Enquete", icon: BarChart2, href: "#", desc: "Pergunte à comunidade" },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-black text-white pl-5 pr-4 py-2.5 rounded-full font-bold text-sm hover:bg-gray-800 transition-all shadow-lg shadow-black/10 active:scale-95"
      >
        <Plus size={18} />
        <span>Publicar</span>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
          <div className="p-2 space-y-1">
            {options.map((opt) => (
              <Link 
                key={opt.label}
                href={opt.href}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                onClick={() => setIsOpen(false)}
              >
                <div className="p-2 bg-gray-100 rounded-lg text-gray-600 group-hover:bg-white group-hover:text-brand-purple group-hover:shadow-sm transition-all">
                   <opt.icon size={18} />
                </div>
                <div>
                   <h4 className="text-sm font-bold text-gray-900">{opt.label}</h4>
                   <p className="text-[10px] text-gray-500 font-medium">{opt.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}