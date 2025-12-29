export function ContextBar() {
  return (
    <aside className="hidden xl:block w-80 fixed right-0 top-0 h-screen border-l border-gray-50 bg-white p-8">
      <div className="space-y-8">
        <section>
          <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4">Em Leitura Agora</h3>
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <p className="text-sm font-bold text-gray-900">O Hobbit</p>
            <p className="text-xs text-gray-500">J.R.R. Tolkien</p>
            <div className="w-full bg-gray-200 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-brand-purple h-full w-[65%]" />
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4">Sugestões de Leitores</h3>
          {/* Mapear sugestões aqui */}
        </section>
      </div>
    </aside>
  );
}