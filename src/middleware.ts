import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  // 1. Cria uma resposta vazia para podermos manipular os headers/cookies
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Inicializa o cliente Supabase conectado ao HUB (Fonte da Autenticação)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_HUB_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_HUB_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // 3. Verifica o usuário (refreshing session if needed)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Definição de Rotas
  const isAuthRoute = pathname.startsWith("/login");
  const isProtectedRoute = 
    pathname === "/" || 
    pathname.startsWith("/settings") || 
    pathname.startsWith("/library") ||
    pathname.startsWith("/forums");

  // CENÁRIO 1: Usuário NÃO logado tenta acessar rota protegida
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Opcional: Salvar a URL original para redirecionar de volta depois
    // url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // CENÁRIO 2: Usuário LOGADO tenta acessar página de login
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Permite o acesso
  return response;
}

// Configuração: Define quais rotas ativam o middleware
export const config = {
  matcher: [
    /*
     * Corresponde a todos os caminhos de solicitação, exceto:
     * 1. /api/ (rotas de API)
     * 2. /_next/ (arquivos estáticos do Next.js)
     * 3. /static (arquivos estáticos dentro da pasta public)
     * 4. arquivos com extensão (favicon.ico, imagens, etc)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};