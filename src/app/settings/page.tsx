import { Sidebar } from "@/components/layout/Sidebar";
import { User, Eye, Lock, Bell, Palette } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      
      <main className="flex-1 lg:ml-64 p-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-2">Configurações</h1>
        <p className="text-gray-500 mb-8">Gerencie sua identidade no Facillit Stories.</p>

        <div className="grid gap-6">
          
          {/* Cartão de Perfil */}
          <section className="border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="p-3 bg-brand-purple/10 rounded-lg text-brand-purple">
                  <User size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Perfil Público</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Como você aparece para outros leitores, sua bio e foto.
                  </p>
                </div>
              </div>
              <Link 
                href="/u/me" // Em um caso real, redirecionaria para o username do contexto
                className="flex items-center gap-2 text-sm font-medium text-brand-purple hover:text-brand-green transition-colors"
              >
                <Eye size={16} />
                Visualizar Perfil
              </Link>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-50 flex gap-4">
              <button className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800">
                Editar Dados
              </button>
            </div>
          </section>

          {/* Outras Configurações (Placeholders) */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-gray-100 rounded-xl p-6">
              <Lock className="w-6 h-6 text-gray-400 mb-4" />
              <h3 className="font-semibold mb-2">Privacidade</h3>
              <p className="text-sm text-gray-500">Quem pode ver suas estantes e anotações.</p>
            </div>
            
            <div className="border border-gray-100 rounded-xl p-6">
              <Palette className="w-6 h-6 text-gray-400 mb-4" />
              <h3 className="font-semibold mb-2">Aparência</h3>
              <p className="text-sm text-gray-500">Tema claro/escuro e tamanho da fonte.</p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}