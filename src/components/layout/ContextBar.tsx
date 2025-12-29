import { BookOpen, TrendingUp } from "lucide-react";

export function ContextBar() {
  return (
    <aside className="hidden xl:block w-80 fixed right-0 top-0 h-screen border-l border-gray-50 bg-white p-8 z-40 overflow-y-auto scrollbar-hide">
      <div className="space-y-10">
        
        {/* Widget: Leitura Atual */}
        <section className="animate-in fade-in slide-in-from-right-4 duration-700">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
            <BookOpen size={12}/> Em Leitura
          </h3>
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-brand-purple/20 transition-colors cursor-pointer group">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <p className="text-sm font-bold text-gray-900 group-hover:text-brand-purple transition-colors">O Silmarillion</p>
                    <p className="text-xs text-gray-500">J.R.R. Tolkien</p>
                </div>
                <div className="bg-white px-2 py-1 rounded-md text-[10px] font-bold text-brand-purple border border-gray-100 shadow-sm">
                    42%
                </div>
            </div>
            <div className="w-full bg-gray-200 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-brand-gradient h-full w-[42%]" />
            </div>
            <p className="text-[10px] text-gray-400 mt-2 text-right">Página 124 de 350</p>
          </div>
        </section>

        {/* Widget: Tópicos */}
        <section>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
             <TrendingUp size={12}/> Comunidade
          </h3>
          <div className="space-y-3">
             {['#FicçãoCientífica', 'Clube do Livro SP', 'Resenhas Semanais'].map((tag, i) => (
                 <div key={i} className="flex justify-between items-center group cursor-pointer p-2 -mx-2 hover:bg-gray-50 rounded-lg transition-colors">
                     <span className="text-xs font-bold text-gray-600 group-hover:text-brand-purple transition-colors">{tag}</span>
                     <span className="text-[9px] font-medium text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded-full">2k</span>
                 </div>
             ))}
          </div>
        </section>

        {/* Widget: Sugestões (Placeholder) */}
        <section>
            <div className="p-4 rounded-xl bg-gradient-to-br from-brand-purple/5 to-transparent border border-brand-purple/10">
                <p className="text-xs font-medium text-brand-purple mb-2">Desafio de Leitura</p>
                <p className="text-[10px] text-gray-500 leading-relaxed">
                    Você leu 0 livros este mês. Que tal começar um conto curto hoje?
                </p>
            </div>
        </section>

      </div>
    </aside>
  );
}