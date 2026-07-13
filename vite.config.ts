import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/accountbook/",
  plugins: [react()],
  server: {
    port: 8080,
  },
});
