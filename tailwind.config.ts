import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cores Oficiais Facillit Stories [cite: 509]
        brand: {
          green: "#07f49e",
          purple: "#42047e",
        },
        // Fundo branco absoluto [cite: 500]
        background: "#ffffff",
      },
      backgroundImage: {
        // Gradiente oficial [cite: 509]
        'brand-gradient': 'linear-gradient(90deg, #42047e 0%, #07f49e 100%)',
      },
      fontFamily: {
        // Fonte Inter obrigatória [cite: 501]
        sans: ['var(--font-inter)'],
      }
    },
  },
  plugins: [],
};
export default config;