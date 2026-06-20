import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// base: './' keeps asset + data paths relative so the build works on any
// GitHub Pages project subpath (e.g. /csh-registry-demo/) without hardcoding.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
});
