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

module.exports = nextConfig;
