import { AuthError } from "@supabase/supabase-js";

export function getAuthErrorMessage(error: AuthError | Error | null): string {
  if (!error) return "";

  // Mensagem original para log (útil para debug)
  const message = error.message;

  // Mapeamento de Erros Comuns do Supabase
  // Adicione novos casos aqui conforme descobrir novos erros
  switch (message) {
    case "Invalid login credentials":
      return "E-mail ou senha incorretos. Verifique e tente novamente.";
    
    case "Email not confirmed":
      return "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.";
    
    case "User not found":
      return "Não encontramos um usuário com este e-mail.";
    
    case "Too many requests":
    case "Too many requests. Try again later.":
      return "Muitas tentativas consecutivas. Aguarde alguns minutos antes de tentar novamente.";
    
    case "Network request failed":
    case "Failed to fetch":
      return "Erro de conexão. Verifique sua internet.";
      
    case "Password should be at least 6 characters":
      return "A senha deve ter no mínimo 6 caracteres.";

    // Erros genéricos de validação
    default:
      // Se for um erro de servidor (500), geralmente começa com 'Database error' ou similar
      if (message.includes("Database error")) {
        return "Ocorreu um erro interno no servidor. Tente mais tarde.";
      }
      
      // Fallback para mensagens desconhecidas (mas traduzindo o óbvio)
      return "Ocorreu um erro ao tentar entrar. Tente novamente.";
  }
}