import Link from "next/link";
import React from "react";

interface RichTextProps {
  content: string;
  className?: string;
}

export function RichText({ content, className }: RichTextProps) {
  if (!content) return null;

  // Regex para encontrar @username (assume letras, numeros, _ e .)
  const mentionRegex = /@(\w[\w.-]*)/g;
  
  // Divide o texto em partes
  const parts = content.split(mentionRegex);
  const matches = content.match(mentionRegex);

  if (!matches) {
    return <p className={className}>{content}</p>;
  }

  return (
    <p className={className}>
      {parts.map((part, index) => {
        // Se a parte anterior era um match, este índice é o conteúdo capturado pelo grupo do regex
        // Mas o split do JS funciona de jeito peculiar com grupos de captura.
        // Vamos simplificar: reconstruir verificando se é um username.
        
        // Estratégia mais segura: Parsear manualmente
        return (
            <React.Fragment key={index}>
                {part}
                {matches[index] && (
                    <Link 
                        href={`/u/${matches[index].substring(1)}`} // Remove o @
                        className="text-brand-purple font-bold hover:underline cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {matches[index]}
                    </Link>
                )}
            </React.Fragment>
        )
      })}
    </p>
  );
}

// Versão simplificada e robusta para renderizar
export function ParsedContent({ text, className }: { text: string, className?: string }) {
    const words = text.split(/(\s+)/); // Mantém espaços
    
    return (
        <p className={className}>
            {words.map((word, i) => {
                if (word.startsWith('@') && word.length > 1) {
                    const username = word.substring(1).replace(/[^a-zA-Z0-9._-]/g, ""); // Limpa pontuação final
                    const suffix = word.substring(username.length + 1);
                    return (
                        <span key={i}>
                            <Link href={`/u/${username}`} className="font-bold text-brand-purple hover:underline">
                                @{username}
                            </Link>
                            {suffix}
                        </span>
                    );
                }
                return <span key={i}>{word}</span>;
            })}
        </p>
    )
}