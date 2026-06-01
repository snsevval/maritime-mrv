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
