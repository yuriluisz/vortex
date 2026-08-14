import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    env: {
      ASAAS_API_KEY: "test-asaas-key",
      ASAAS_API_URL: "https://sandbox.asaas.com/api/v3",
      CLOUDFLARE_API_TOKEN: "test-cf-token",
      CLOUDFLARE_ZONE_ID: "test-cf-zone",
      EVOLUTION_API_KEY: "test-evo-key",
      EVOLUTION_API_URL: "http://evolution.local",
    },
  },
});
