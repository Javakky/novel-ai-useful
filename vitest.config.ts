import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      // `server-only` は本来 Server Component 専用だが、vitest (jsdom 環境) では
      // import 時に throw してテストが落ちる。テスト中は空モジュールに差し替える。
      "server-only": resolve(__dirname, "./src/test/server-only-stub.ts"),
    },
  },
});
