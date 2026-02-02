import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Logo from "@/components/Logo";

export default function Home() {
  const { estaAutenticado, usuario, getRutaInicio } = useAuth();
  const router = useRouter();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (estaAutenticado && usuario) {
      router.push(getRutaInicio());
    }
  }, [estaAutenticado, usuario]);

  return (
    <>
      <Head>
        <title>Repartos SI - Sistema de Gestión de Repartos</title>
        <meta name="description" content="Sistema de gestión de repartos" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-orange-500">
        {/* Navbar */}
        <nav className="bg-white/10 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/">
              <Logo size="lg" variant="white" />
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-white hover:text-white/80 font-medium"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/auth/registro"
                className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-white/90 transition-colors"
              >
                Registrarse
              </Link>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <section className="text-center py-16">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Gestiona tus repartos de forma{" "}
              <span className="text-yellow-300">inteligente</span>
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Sistema integral para clientes, depósitos y transportistas.
              Conecta tu negocio con la logística perfecta.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/registro"
                className="bg-white text-purple-600 text-lg px-8 py-4 rounded-xl font-bold hover:bg-white/90 transition-all transform hover:scale-105 shadow-lg"
              >
                Comenzar Ahora
              </Link>
              <Link
                href="/auth/login"
                className="bg-white/20 text-white text-lg px-8 py-4 rounded-xl font-bold hover:bg-white/30 transition-all border-2 border-white/50"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </section>

          {/* Tipos de Usuario */}
          <section className="py-12">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Tres módulos, una solución
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-8 text-center shadow-xl transform hover:scale-105 transition-all">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">👤</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Clientes
                </h3>
                <p className="text-gray-600 mb-4">
                  Realiza pedidos a múltiples depósitos, gestiona tu carrito y
                  lleva tu contabilidad personal.
                </p>
                <ul className="text-sm text-gray-500 space-y-1 text-left">
                  <li>✓ Ver catálogo de depósitos</li>
                  <li>✓ Carrito multi-depósito</li>
                  <li>✓ Historial de pedidos</li>
                  <li>✓ Control de gastos</li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-8 text-center shadow-xl transform hover:scale-105 transition-all">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🏪</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Depósitos
                </h3>
                <p className="text-gray-600 mb-4">
                  Gestiona tu inventario, recibe pedidos automáticamente y
                  coordina los envíos.
                </p>
                <ul className="text-sm text-gray-500 space-y-1 text-left">
                  <li>✓ Gestión de inventario</li>
                  <li>✓ Recepción de pedidos</li>
                  <li>✓ Notificaciones en tiempo real</li>
                  <li>✓ Reportes de ventas</li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-8 text-center shadow-xl transform hover:scale-105 transition-all">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🚚</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Transportistas
                </h3>
                <p className="text-gray-600 mb-4">
                  Recibe envíos asignados, optimiza tu ruta y gestiona tu
                  vehículo y ganancias.
                </p>
                <ul className="text-sm text-gray-500 space-y-1 text-left">
                  <li>✓ Ruta optimizada del día</li>
                  <li>✓ Control de entregas</li>
                  <li>✓ Gestión de vehículo</li>
                  <li>✓ Registro de ganancias</li>
                </ul>
              </div>
            </div>
          </section>

          {/* CTA Final */}
          <section className="py-12 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                ¿Listo para comenzar?
              </h2>
              <p className="text-white/80 mb-8 max-w-xl mx-auto">
                Regístrate ahora y comienza a gestionar tus repartos de manera
                profesional.
              </p>
              <Link
                href="/auth/registro"
                className="inline-block bg-white text-purple-600 text-lg px-10 py-4 rounded-xl font-bold hover:bg-white/90 transition-all shadow-lg"
              >
                Crear mi cuenta →
              </Link>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="bg-black/20 py-6">
          <div className="container mx-auto px-4 text-center text-white/60">
            <p>© 2026 Repartos-SI. Todos los derechos reservados.</p>
          </div>
        </footer>
      </main>
    </>
  );
}
