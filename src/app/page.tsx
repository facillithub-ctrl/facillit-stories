import { Sidebar } from "@/components/layout/Sidebar";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p className="text-gray-600">Bem-vindo ao início do Facillit Stories.</p>
        <div className="mt-4 p-4 bg-brand-purple/10 text-brand-purple rounded-md">
           <strong>Dica de Dev:</strong> Tente acessar <code>/u/seu-usuario</code> (após criar um no banco) para testar o perfil.
        </div>
      </main>
    </div>
  );
}