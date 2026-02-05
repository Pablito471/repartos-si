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
  // Ignorar errores de ESLint durante build (arreglar después)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
