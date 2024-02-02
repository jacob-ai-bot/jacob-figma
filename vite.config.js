// vite.config.ts
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [],
  test: {
    globals: true,
    environment: "node",
  },
});
