"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Type, Image as ImageIcon, FileText } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function CreatePostButton() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    { label: "Post Rápido", icon: Type, href: "/post-oficial", desc: "Texto simples" },
    { label: "Mídia", icon: ImageIcon, href: "#", desc: "Foto ou Vídeo" },
    { label: "Artigo", icon: FileText, href: "#", desc: "Formatação rica" },
  ];

  return (
    <div className="relative z-[9999]" ref={dropdownRef}>
      
      {/* Botão Desktop (Gradiente da Marca) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="hidden lg:flex items-center gap-2 bg-gradient-to-r from-[#42047e] to-[#07f49e] text-white pl-5 pr-6 py-2.5 rounded-full font-bold text-sm hover:shadow-lg hover:shadow-[#42047e]/20 transition-all active:scale-95"
      >
        <Plus size={18} />
        <span>Publicar</span>
      </button>

      {/* Botão Mobile (FAB) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden w-14 h-14 rounded-full bg-gradient-to-tr from-[#42047e] to-[#07f49e] text-white flex items-center justify-center shadow-xl shadow-[#42047e]/30 active:scale-90 transition-transform"
      >
        <Plus size={28} className={cn("transition-transform duration-200", isOpen && "rotate-45")} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 lg:bottom-auto lg:top-full lg:right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden z-[9999] animate-in fade-in zoom-in-95 duration-200 origin-bottom-right lg:origin-top-right p-2">
          {options.map((opt) => (
            <Link 
              key={opt.label}
              href={opt.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-[#42047e]/5 text-[#42047e] flex items-center justify-center group-hover:bg-[#42047e] group-hover:text-white transition-all">
                  <opt.icon size={16} />
              </div>
              <div>
                  <h4 className="text-sm font-bold text-gray-900">{opt.label}</h4>
                  <p className="text-[10px] text-gray-400">{opt.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}