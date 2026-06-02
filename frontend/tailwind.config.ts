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
          50: "#e7eef8",
          100: "#c3d4ee",
          200: "#9db8e3",
          300: "#759cd7",
          400: "#5586cf",
          500: "#3370c6",
          600: "#2a61b8",
          700: "#1e4e9e",
          800: "#143c84",
          900: "#082460",
        },
      },
    },
  },
  plugins: [],
};

export default config;
