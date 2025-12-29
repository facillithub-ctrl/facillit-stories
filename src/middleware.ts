import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // 1. Cria a resposta inicial
  // Precisamos dela para poder setar/remover cookies durante a verificação
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Cliente Supabase (Conectado ao HUB - onde está a autenticação)
  // É CRÍTICO que estas variáveis de ambiente estejam corretas no .env.local
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_HUB_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_HUB_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Sincroniza o cookie no request (para o passo atual)
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          // Sincroniza o cookie na resposta (para o navegador)
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // 3. Verifica a sessão
  // Isso chama o Supabase para validar o token contido nos cookies
  const { data: { user } } = await supabase.auth.getUser();

  // 4. Lógica de Redirecionamento
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Definição das rotas
  const isLoginPage = pathname === "/login";
  
  // Rotas que NÃO precisam de autenticação (Públicas)
  // Adicione aqui qualquer rota que deva ser acessível sem login
  const isPublicRoute = 
    pathname.startsWith("/u/") || // Perfis públicos
    pathname === "/login" ||      // A própria página de login
    pathname === "/master-login"; // (Se ainda existir)

  // CASO A: Usuário JÁ LOGADO tentando acessar a página de LOGIN
  // Ação: Manda para a Home (Dashboard)
  if (user && isLoginPage) {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // CASO B: Usuário NÃO LOGADO tentando acessar rota PRIVADA
  // Ação: Manda para o Login
  if (!user && !isPublicRoute) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Se nada acima acontecer, permite a navegação normal
  return response;
}

export const config = {
  matcher: [
    /*
     * Ignora rotas internas do Next.js e arquivos estáticos
     * para não sobrecarregar o middleware
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};