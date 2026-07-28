import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite que o Next.js aceite requisições vindas do Localtunnel
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok.io",
    "*.trycloudflare.com",
    "meu-vortex-teste.loca.lt",
    "meu-vortex-teste-2.loca.lt",
    "localhost:3000",
  ],
};

export default nextConfig;
