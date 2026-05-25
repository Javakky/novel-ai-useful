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
        // Novel AI テーマカラー
        nai: {
          bg: "#1a1a2e",
          surface: "#16213e",
          primary: "#0f3460",
          accent: "#e94560",
          text: "#eaeaea",
          muted: "#8a8a9a",
        },
      },
    },
  },
  plugins: [],
};

export default config;
