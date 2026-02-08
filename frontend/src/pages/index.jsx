import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Logo from "@/components/logo";
import ThemeToggle from "@/components/ThemeToggle";
import Icons from "@/components/Icons";

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

      <main className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 transition-colors duration-300">
        {/* Navbar */}
        <nav className="bg-white/10 dark:bg-neutral-900/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
            <Link href="/" className="flex-shrink-0">
              <Logo size="md" className="sm:hidden" />
              <Logo size="lg" className="hidden sm:inline-flex" />
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeToggle />
              <Link
                href="/auth/login"
                className="text-white hover:text-white/80 font-medium text-sm sm:text-base hidden xs:inline"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/auth/registro"
                className="bg-white dark:bg-neutral-700 text-primary-700 dark:text-neutral-100 px-3 sm:px-4 py-2 rounded-lg font-semibold hover:bg-white/90 dark:hover:bg-neutral-600 transition-colors text-sm sm:text-base whitespace-nowrap"
              >
                <span className="hidden xs:inline">Registrarse</span>
                <span className="xs:hidden">Entrar</span>
              </Link>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
          {/* Hero Section */}
          <section className="text-center py-8 sm:py-12 lg:py-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              Gestiona tu negocio y repartos de forma{" "}
              <span className="text-accent-400">inteligente</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-white/80 dark:text-neutral-300 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              Sistema integral para negocios, depósitos y transportistas.
              Conecta tu negocio con la logística perfecta.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Link
                href="/auth/registro"
                className="bg-white dark:bg-neutral-100 text-primary-700 dark:text-primary-800 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:bg-white/90 dark:hover:bg-neutral-200 transition-all transform hover:scale-105 shadow-lg"
              >
                Comenzar Ahora
              </Link>
              <Link
                href="/auth/login"
                className="bg-white/20 dark:bg-neutral-700/50 text-white text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:bg-white/30 dark:hover:bg-neutral-700 transition-all border-2 border-white/50 dark:border-neutral-600"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </section>

          {/* Tipos de Usuario */}
          <section className="py-8 sm:py-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8 sm:mb-12 px-4">
              Tres módulos, una solución
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 sm:p-8 text-center shadow-xl dark:shadow-neutral-900/50 transform hover:scale-[1.02] sm:hover:scale-105 transition-all">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Icons.User className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
                  Clientes
                </h3>
                <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-4">
                  Realiza pedidos a múltiples depósitos, gestiona tu carrito y
                  lleva tu contabilidad personal.
                </p>
                <ul className="text-sm text-neutral-500 dark:text-neutral-400 space-y-1 text-left">
                  <li className="flex items-center gap-2">
                    <Icons.CheckCircle className="w-4 h-4 text-green-500" /> Ver
                    catálogo de depósitos
                  </li>
                  <li className="flex items-center gap-2">
                    <Icons.CheckCircle className="w-4 h-4 text-green-500" />{" "}
                    Carrito multi-depósito
                  </li>
                  <li className="flex items-center gap-2">
                    <Icons.CheckCircle className="w-4 h-4 text-green-500" />{" "}
                    Historial de pedidos
                  </li>
                  <li className="flex items-center gap-2">
                    <Icons.CheckCircle className="w-4 h-4 text-green-500" />{" "}
                    Control de gastos
                  </li>
                </ul>
              </div>

              <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 sm:p-8 text-center shadow-xl dark:shadow-neutral-900/50 transform hover:scale-[1.02] sm:hover:scale-105 transition-all">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-secondary-100 dark:bg-secondary-900/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Icons.Building className="w-8 h-8 sm:w-10 sm:h-10 text-secondary-600 dark:text-secondary-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
                  Depósitos
                </h3>
                <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-4">
                  Gestiona tu inventario, recibe pedidos automáticamente y
                  coordina los envíos.
                </p>
                <ul className="text-sm text-neutral-500 dark:text-neutral-400 space-y-1 text-left">
                  <li className="flex items-center gap-2">
                    <Icons.CheckCircle className="w-4 h-4 text-green-500" />{" "}
                    Gestión de inventario
                  </li>
                  <li className="flex items-center gap-2">
                    <Icons.CheckCircle className="w-4 h-4 text-green-500" />{" "}
                    Recepción de pedidos
                  </li>
                  <li className="flex items-center gap-2">
                    <Icons.CheckCircle className="w-4 h-4 text-green-500" />{" "}
                    Notificaciones en tiempo real
                  </li>
                  <li className="flex items-center gap-2">
                    <Icons.CheckCircle className="w-4 h-4 text-green-500" />{" "}
                    Reportes de ventas
                  </li>
                </ul>
              </div>

              <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 sm:p-8 text-center shadow-xl dark:shadow-neutral-900/50 transform hover:scale-[1.02] sm:hover:scale-105 transition-all sm:col-span-2 lg:col-span-1">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-accent-100 dark:bg-accent-900/30 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Icons.Truck className="w-8 h-8 sm:w-10 sm:h-10 text-accent-600 dark:text-accent-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
                  Transportistas
                </h3>
                <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-4">
                  Recibe envíos asignados, optimiza tu ruta y gestiona tu
                  vehículo y ganancias.
                </p>
                <ul className="text-sm text-neutral-500 dark:text-neutral-400 space-y-1 text-left">
                  <li className="flex items-center gap-2">
                    <Icons.CheckCircle className="w-4 h-4 text-green-500" />{" "}
                    Ruta optimizada del día
                  </li>
                  <li className="flex items-center gap-2">
                    <Icons.CheckCircle className="w-4 h-4 text-green-500" />{" "}
                    Control de entregas
                  </li>
                  <li className="flex items-center gap-2">
                    <Icons.CheckCircle className="w-4 h-4 text-green-500" />{" "}
                    Gestión de vehículo
                  </li>
                  <li className="flex items-center gap-2">
                    <Icons.CheckCircle className="w-4 h-4 text-green-500" />{" "}
                    Registro de ganancias
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* CTA Final */}
          <section className="py-8 sm:py-12 text-center">
            <div className="bg-white/10 dark:bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 lg:p-12 mx-2 sm:mx-0">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
                ¿Listo para comenzar?
              </h2>
              <p className="text-sm sm:text-base text-white/80 dark:text-neutral-300 mb-6 sm:mb-8 max-w-xl mx-auto">
                Regístrate ahora y comienza a gestionar tus repartos de manera
                profesional.
              </p>
              <Link
                href="/auth/registro"
                className="inline-block bg-white dark:bg-neutral-100 text-primary-700 dark:text-primary-800 text-base sm:text-lg px-6 sm:px-10 py-3 sm:py-4 rounded-xl font-bold hover:bg-white/90 dark:hover:bg-neutral-200 transition-all shadow-lg"
              >
                Crear mi cuenta →
              </Link>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="bg-black/20 dark:bg-neutral-900/50 py-4 sm:py-6">
          <div className="container mx-auto px-4 text-center text-white/60 dark:text-neutral-500 text-sm sm:text-base">
            <p>© 2026 Repartos-SI. Todos los derechos reservados.</p>
          </div>
        </footer>
      </main>
    </>
  );
}
