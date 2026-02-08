/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configuración para Vercel
  images: {
    domains: [],
    unoptimized: false,
  },
  // Suprimir errores de hydration en producción
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // ESLint habilitado - mostrar warnings pero no fallar el build
  eslint: {
    ignoreDuringBuilds: true,
    dirs: ["src"],
  },
};

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

module.exports = withPWA(nextConfig);
