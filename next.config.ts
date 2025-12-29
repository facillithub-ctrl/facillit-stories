import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        // Este é o domínio do seu Supabase que apareceu no erro
        hostname: 'dcwmqivwwfzlixquspah.supabase.co',
        port: '',
        // Permite qualquer caminho dentro desse domínio (storage, etc)
        pathname: '/**',
      },
      // (Opcional) Adicione este bloco se planeja usar avatares do Google/Github futuramente
      /*
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      */
    ],
  },
};

export default nextConfig;