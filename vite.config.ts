/// <reference types="vitest/config" />
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "next/link", replacement: fileURLToPath(new URL("./src/next-link.tsx", import.meta.url)) },
      { find: "next/navigation", replacement: fileURLToPath(new URL("./src/next-navigation.ts", import.meta.url)) },
      { find: "@/app/conect3", replacement: fileURLToPath(new URL("./src/conect3", import.meta.url)) },
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
    ],
  },
  build: { outDir: "dist", emptyOutDir: true },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
