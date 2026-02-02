import Link from "next/link";
import { useState } from "react";
import Logo from "@/components/Logo";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <Logo size="md" />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className="text-gray-700 hover:text-primary transition-colors"
            >
              Inicio
            </Link>
            <Link
              href="/pedidos"
              className="text-gray-700 hover:text-primary transition-colors"
            >
              Pedidos
            </Link>
            <Link
              href="/repartos"
              className="text-gray-700 hover:text-primary transition-colors"
            >
              Repartos
            </Link>
            <Link
              href="/reportes"
              className="text-gray-700 hover:text-primary transition-colors"
            >
              Reportes
            </Link>
            <button className="btn-primary">Iniciar Sesión</button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              <Link
                href="/"
                className="text-gray-700 hover:text-primary transition-colors"
              >
                Inicio
              </Link>
              <Link
                href="/pedidos"
                className="text-gray-700 hover:text-primary transition-colors"
              >
                Pedidos
              </Link>
              <Link
                href="/repartos"
                className="text-gray-700 hover:text-primary transition-colors"
              >
                Repartos
              </Link>
              <Link
                href="/reportes"
                className="text-gray-700 hover:text-primary transition-colors"
              >
                Reportes
              </Link>
              <button className="btn-primary w-full">Iniciar Sesión</button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
