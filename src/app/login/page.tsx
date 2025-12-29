"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { hubClient } from "@/lib/supabase/clients";
import { Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { AuthError } from "@supabase/supabase-js"; // Importação do tipo oficial

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Autentica no HUB (Fonte da Verdade)
      const { data, error: authError } = await hubClient.auth.signInWithPassword({
        email,
        password,
      });

      // Tratamento de erro tipado diretamente do retorno do Supabase
      if (authError) {
        // Switch case opcional para mensagens amigáveis em português
        switch (authError.message) {
          case "Invalid login credentials":
            throw new Error("E-mail ou senha incorretos.");
          case "Email not confirmed":
            throw new Error("Por favor, confirme seu e-mail antes de entrar.");
          default:
            throw new Error(authError.message);
        }
      }

      if (data.session) {
        // 2. Sucesso: Redireciona
        // O cliente Supabase gerencia o cookie de sessão automaticamente no domínio local
        // se configurado, ou mantemos o estado no client-side por enquanto.
        console.log("Autenticado via Hub. User ID:", data.user.id);
        
        // Aqui futuramente faremos a checagem/sincronia do perfil no banco Stories
        router.push("/");
      }
    } catch (err) {
      // Tratamento de erro genérico sem usar 'any'
      if (err instanceof Error) {
        setError(err.message);
      } else if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro inesperado. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white font-sans">
      
      {/* Lado Esquerdo - Visual Institucional (Enterprise Clean) */}
      <div className="hidden md:flex md:w-1/2 bg-brand-gradient relative overflow-hidden items-center justify-center p-12 text-white">
        {/* Pattern sutil de fundo opcional */}
        <div className="absolute inset-0 bg-black/5 mix-blend-overlay" />
        
        <div className="relative z-10 max-w-lg animate-in fade-in slide-in-from-left duration-700">
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium tracking-wider uppercase backdrop-blur-sm border border-white/20">
            Facillit Hub ID
          </div>
          <h1 className="text-5xl font-bold mb-6 tracking-tight">Facillit Stories</h1>
          <p className="text-lg text-white/90 font-light leading-relaxed">
            A rede social focada na profundidade da leitura. Conecte-se através de histórias e debates estruturados, sem distrações.
          </p>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
          
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Acessar Conta</h2>
            <p className="mt-2 text-sm text-gray-500">
              Utilize suas credenciais únicas do <span className="text-brand-purple font-semibold">Facillit Hub</span>.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all bg-gray-50/50 focus:bg-white"
                  placeholder="nome@exemplo.com"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label>
                  <a href="#" className="text-xs font-medium text-brand-purple hover:text-brand-green transition-colors">
                    Esqueceu a senha?
                  </a>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all bg-gray-50/50 focus:bg-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <>
                  Entrar
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="pt-6 text-center text-sm border-t border-gray-50">
            <span className="text-gray-500">Ainda não faz parte?</span>{' '}
            <a href="#" className="font-semibold text-brand-purple hover:text-brand-green transition-colors">
              Criar Facillit ID
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}