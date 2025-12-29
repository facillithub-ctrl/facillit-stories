import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css"; // Certifique-se de mover o globals.css para src/styles/

// Configuração da Fonte Inter [cite: 501]
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Facillit Stories",
  description: "Rede social literária focada em leitura real.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans bg-white text-black antialiased`}>
        {children}
      </body>
    </html>
  );
}