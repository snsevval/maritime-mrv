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
        teal: {
          50: "#e6f4f6",
          100: "#c0e4e9",
          200: "#96d0d8",
          300: "#6bbcc6",
          400: "#44abb7",
          500: "#1A7A8A",
          600: "#1A7A8A",
          700: "#156878",
          800: "#0f5463",
          900: "#093f4a",
        },
        navy: {
          50: "#e8f5f6",
          100: "#c3e4e8",
          200: "#9ad1d7",
          300: "#6dbcc5",
          400: "#47a9b4",
          500: "#1A7A8A",
          600: "#156e7d",
          700: "#115e6b",
          800: "#0c4d58",
          900: "#083a43",
        },
      },
    },
  },
  plugins: [],
};

export default config;
