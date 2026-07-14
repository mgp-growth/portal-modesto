import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Identidade Modesto
        brand: {
          ink: "#1A1A18",    // carvão quente da marca
          paper: "#EDE8DE",  // papel/bone (fundo)
          gold: "#A8823C",   // dourado de exibição
        },
        // Neutros quentes (fundo mais fechado -> cartões brancos saltam)
        gray: {
          50: "#EDE8DE",
          100: "#E4DED2",
          200: "#D8D1C2",
          300: "#C6BDA9",
          400: "#A39A86",
          500: "#79715F",
          600: "#554E42",
          700: "#3B362D",
          800: "#29241E",
          900: "#1A1A18",
          950: "#100F0D",
        },
        // Ação primária -> DOURADO/ÂMBAR (no lugar do índigo)
        indigo: {
          400: "#C9A24E", // acento claro (detalhes no header escuro)
          500: "#B4893A", // foco / bordas
          600: "#96701F", // fundo de botão (texto branco legível)
          700: "#785819", // hover
          800: "#5E4514",
        },
        // Erros -> tijolo contido
        red: {
          500: "#B04A3E",
          600: "#9C3A30",
          700: "#7F2E26",
        },
      },
    },
  },
  plugins: [],
};
export default config;
