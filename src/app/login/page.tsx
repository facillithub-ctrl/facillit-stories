"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { hubClient } from "@/lib/supabase/clients"; // Certifique-se que este exporta o createBrowserClient
import { getAuthErrorMessage } from "@/lib/auth-errors"; // Importando nossa nova biblioteca
import { ArrowRight, Loader2, AlertCircle, Lock } from "lucide-react";
import { AuthError } from "@supabase/supabase-js";

export default function LoginPage() {
  const router = useRouter();
  
  // Estados tipados
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Manipulador de Login
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Tenta autenticar no HUB (Fonte da Verdade)
      const { data, error: authError } = await hubClient.auth.signInWithPassword({
        email,
        password,
      });

      // Se houver erro, lançamos para o catch tratar via biblioteca
      if (authError) {
        throw authError;
      }

      if (data.session) {
        // 2. SUCESSO
        // O cliente browser já salvou o cookie. Agora precisamos garantir que o Next.js saiba disso.
        
        // Força atualização dos caches do router
        router.refresh();

        // 3. Redirecionamento Robusto
        // Usamos window.location.href em vez de router.push para garantir um "hard navigation".
        // Isso força o browser a enviar o novo cookie para o servidor/middleware sem depender do cache do cliente.
        setTimeout(() => {
          window.location.href = "/";
        }, 500); // Pequeno delay para garantir a propagação do cookie local
      } else {
        throw new Error("Sessão não criada. Tente novamente.");
      }

    } catch (err) {
      // 4. Tratamento de Erro Centralizado (Sem 'any')
      // A função getAuthErrorMessage aceita AuthError, Error ou null
      const userFriendlyMessage = getAuthErrorMessage(err as AuthError | Error);
      setError(userFriendlyMessage);
      setLoading(false); // Só paramos o loading em caso de erro. No sucesso, ele continua até a página mudar.
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white font-sans text-black">
      
      {/* Lado Esquerdo - Visual Institucional */}
      <div className="hidden md:flex md:w-1/2 bg-brand-gradient relative overflow-hidden items-center justify-center p-12 text-white">
        <div className="absolute inset-0 bg-black/5 mix-blend-overlay" />
        
        {/* Conteúdo com Animação de Entrada */}
        <div className="relative z-10 max-w-lg animate-in fade-in slide-in-from-left duration-700">
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium tracking-wider uppercase backdrop-blur-sm border border-white/20">
            Facillit Hub ID
          </div>
          <h1 className="text-5xl font-bold mb-6 tracking-tight">Facillit Stories</h1>
          <p className="text-lg text-white/90 font-light leading-relaxed">
            A rede social focada na profundidade da leitura. Conecte-se através de histórias e debates estruturados, longe do ruído.
          </p>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all bg-gray-50/30 focus:bg-white"
                  placeholder="nome@exemplo.com"
                  disabled={loading}
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label>
                  <a href="#" className="text-xs font-medium text-brand-purple hover:text-brand-green transition-colors">
                    Esqueceu a senha?
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all bg-gray-50/30 focus:bg-white"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                  <Lock className="absolute right-3 top-3.5 text-gray-400 w-5 h-5 opacity-50" />
                </div>
              </div>
            </div>

            {/* Exibição de Erros usando a Biblioteca */}
            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span className="font-medium leading-tight">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Entrando...
                </>
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
              Criar Facillit ID no Hub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}