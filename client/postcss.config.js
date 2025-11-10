// Tailwind v4+: use the dedicated PostCSS plugin package
import tailwind from "@tailwindcss/postcss";
import autoprefixer from "autoprefixer";

export default {
  plugins: [tailwind, autoprefixer()],
};