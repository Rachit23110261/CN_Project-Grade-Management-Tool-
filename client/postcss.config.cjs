// PostCSS config using CommonJS since project uses type: module and Vite expects CJS here
const tailwind = require("@tailwindcss/postcss");
const autoprefixer = require("autoprefixer");

module.exports = {
  plugins: [tailwind(), autoprefixer()],
};
