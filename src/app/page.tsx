export default function Home() {
  return (
    <div className="flex min-h-screen bg-white text-black">
      
      {/* 1. Sidebar Esquerda (Navegação) [cite: 515] */}
      <aside className="w-64 border-r border-gray-100 hidden lg:flex flex-col p-6 sticky top-0 h-screen">
        <div className="font-bold text-2xl text-brand-purple mb-8">Facillit Stories</div>
        <nav className="space-y-4">
          <div className="p-2 bg-gray-50 rounded-md font-medium">Dashboard</div>
          <div className="p-2 text-gray-500 hover:text-black transition-colors">Biblioteca</div>
          <div className="p-2 text-gray-500 hover:text-black transition-colors">Fóruns</div>
        </nav>
      </aside>

      {/* 2. Conteúdo Principal (Fluido) [cite: 515] */}
      <main className="flex-1 max-w-3xl mx-auto w-full border-r border-gray-100 min-h-screen">
        <header className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-semibold">Minha Leitura Atual</h1>
        </header>
        
        <div className="p-6">
          {/* Exemplo de Card de Postagem "Clean White" */}
          <div className="border border-gray-100 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="font-semibold text-lg mb-2">Reflexão sobre O Alienista </h2>
            <p className="text-gray-600 leading-relaxed">
              Texto longo como padrão, incentivando a leitura profunda e não o consumo rápido...
            </p>
          </div>
        </div>
      </main>

      {/* 3. Context Bar Direita (Inteligência Silenciosa) [cite: 515] */}
      <aside className="w-80 hidden xl:block p-6 sticky top-0 h-screen">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Contexto</h3>
          <p className="text-sm text-gray-600">Nenhuma leitura ativa no momento.</p>
        </div>
      </aside>

    </div>
  );
}