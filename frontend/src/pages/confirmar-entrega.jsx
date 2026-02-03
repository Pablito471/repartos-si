import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { showSuccessAlert, showErrorAlert } from "@/utils/alerts";
import Logo from "@/components/logo";
import Link from "next/link";
import Icons from "@/components/Icons";

export default function ConfirmarEntrega() {
  const router = useRouter();
  const { codigo, pedido: pedidoId } = router.query;
  const { usuario } = useAuth();

  const [estado, setEstado] = useState("loading"); // loading, ready, success, error, already_confirmed
  const [entrega, setEntrega] = useState(null);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    if (codigo && pedidoId) {
      verificarEntrega();
    }
  }, [codigo, pedidoId]);

  const verificarEntrega = () => {
    // Obtener entregas pendientes del localStorage
    const entregasPendientes = JSON.parse(
      localStorage.getItem("repartos_entregas_pendientes") || "[]",
    );

    const entregaEncontrada = entregasPendientes.find(
      (e) => e.codigoEntrega === codigo && e.pedidoId === parseInt(pedidoId),
    );

    if (entregaEncontrada) {
      if (entregaEncontrada.confirmada) {
        setEstado("already_confirmed");
        setEntrega(entregaEncontrada);
      } else {
        setEstado("ready");
        setEntrega(entregaEncontrada);
      }
    } else {
      // Verificar en entregas confirmadas
      const entregasConfirmadas = JSON.parse(
        localStorage.getItem("repartos_entregas_confirmadas") || "[]",
      );

      const yaConfirmada = entregasConfirmadas.find(
        (e) => e.codigoEntrega === codigo,
      );

      if (yaConfirmada) {
        setEstado("already_confirmed");
        setEntrega(yaConfirmada);
      } else {
        setEstado("error");
      }
    }
  };

  const confirmarEntrega = async () => {
    if (!usuario) {
      showErrorAlert(
        "Inicia sesión",
        "Debes iniciar sesión como cliente para confirmar la entrega",
      );
      router.push(
        `/auth/login?redirect=/confirmar-entrega?codigo=${codigo}&pedido=${pedidoId}`,
      );
      return;
    }

    if (usuario.tipoUsuario !== "cliente") {
      showErrorAlert(
        "Acceso denegado",
        "Solo los clientes pueden confirmar entregas",
      );
      return;
    }

    setProcesando(true);

    try {
      // Simular procesamiento
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Obtener entregas pendientes
      const entregasPendientes = JSON.parse(
        localStorage.getItem("repartos_entregas_pendientes") || "[]",
      );

      // Marcar como confirmada
      const entregaIndex = entregasPendientes.findIndex(
        (e) => e.codigoEntrega === codigo,
      );

      if (entregaIndex !== -1) {
        const entregaConfirmada = {
          ...entregasPendientes[entregaIndex],
          confirmada: true,
          fechaConfirmacion: new Date().toISOString(),
          clienteConfirmo: usuario.id,
        };

        // Mover a entregas confirmadas
        const entregasConfirmadas = JSON.parse(
          localStorage.getItem("repartos_entregas_confirmadas") || "[]",
        );
        entregasConfirmadas.push(entregaConfirmada);
        localStorage.setItem(
          "repartos_entregas_confirmadas",
          JSON.stringify(entregasConfirmadas),
        );

        // Remover de pendientes
        entregasPendientes.splice(entregaIndex, 1);
        localStorage.setItem(
          "repartos_entregas_pendientes",
          JSON.stringify(entregasPendientes),
        );

        // Agregar productos al stock del cliente
        agregarProductosAlStock(entregaConfirmada.productos, usuario.id);

        setEstado("success");
        setEntrega(entregaConfirmada);

        showSuccessAlert(
          "¡Entrega confirmada!",
          "Los productos han sido agregados a tu stock",
        );
      }
    } catch (error) {
      showErrorAlert("Error", "No se pudo confirmar la entrega");
    } finally {
      setProcesando(false);
    }
  };

  const agregarProductosAlStock = (productos, clienteId) => {
    // Obtener stock actual del cliente
    const stockClientes = JSON.parse(
      localStorage.getItem("repartos_stock_clientes") || "{}",
    );

    if (!stockClientes[clienteId]) {
      stockClientes[clienteId] = [];
    }

    // Agregar o actualizar productos
    productos.forEach((producto) => {
      const productoExistente = stockClientes[clienteId].find(
        (p) => p.nombre === producto.nombre,
      );

      if (productoExistente) {
        productoExistente.cantidad += producto.cantidad;
        productoExistente.ultimaActualizacion = new Date().toISOString();
      } else {
        stockClientes[clienteId].push({
          ...producto,
          fechaIngreso: new Date().toISOString(),
          ultimaActualizacion: new Date().toISOString(),
        });
      }
    });

    localStorage.setItem(
      "repartos_stock_clientes",
      JSON.stringify(stockClientes),
    );
  };

  // Estados de renderizado
  if (estado === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando entrega...</p>
        </div>
      </div>
    );
  }

  if (estado === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icons.XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Código no válido
          </h1>
          <p className="text-gray-600 mb-6">
            El código de entrega no existe o ha expirado. Contacta al depósito
            para obtener un nuevo comprobante.
          </p>
          <Link href="/" className="btn-primary inline-block px-6 py-3">
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }

  if (estado === "already_confirmed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icons.ExclamationTriangle className="w-10 h-10 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Entrega ya confirmada
          </h1>
          <p className="text-gray-600 mb-4">
            Esta entrega ya fue confirmada anteriormente.
          </p>
          {entrega?.fechaConfirmacion && (
            <p className="text-sm text-gray-500 mb-6">
              Confirmada el:{" "}
              {new Date(entrega.fechaConfirmacion).toLocaleString("es-ES")}
            </p>
          )}
          <Link href="/clientes" className="btn-primary inline-block px-6 py-3">
            Ir a mi panel
          </Link>
        </div>
      </div>
    );
  }

  if (estado === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <Icons.CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            ¡Entrega confirmada!
          </h1>
          <p className="text-gray-600 mb-6">
            Los productos han sido agregados a tu stock correctamente.
          </p>

          {/* Resumen de productos */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-800 mb-3">
              Productos recibidos:
            </h3>
            <div className="space-y-2">
              {entrega?.productos?.map((prod, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-gray-600">{prod.nombre}</span>
                  <span className="font-medium text-gray-800">
                    x{prod.cantidad}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/clientes/stock"
            className="btn-primary inline-block px-6 py-3 w-full"
          >
            Ver mi stock
          </Link>
        </div>
      </div>
    );
  }

  // Estado "ready" - Mostrar detalles para confirmar
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <Logo size="md" className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">
            Confirmar Entrega
          </h1>
          <p className="text-gray-600">Pedido #{pedidoId}</p>
        </div>

        {/* Info de entrega */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Icons.Truck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">
                {entrega?.deposito || "Depósito"}
              </p>
              <p className="text-sm text-gray-500">{entrega?.fecha}</p>
            </div>
          </div>

          {/* Productos */}
          <h3 className="font-semibold text-gray-800 mb-3">
            Productos a recibir:
          </h3>
          <div className="space-y-2 mb-4">
            {entrega?.productos?.map((prod, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center bg-white p-3 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-800">{prod.nombre}</p>
                  <p className="text-xs text-gray-500">
                    ${prod.precio?.toLocaleString()} c/u
                  </p>
                </div>
                <div className="text-right">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                    x{prod.cantidad}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <span className="font-semibold text-gray-800">Total:</span>
            <span className="text-xl font-bold text-primary">
              ${entrega?.total?.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Usuario info */}
        {usuario ? (
          <div className="bg-blue-50 rounded-xl p-4 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Icons.User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-600">Confirmando como:</p>
              <p className="font-semibold text-blue-800">{usuario.nombre}</p>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 rounded-xl p-4 mb-6 flex items-center gap-3">
            <Icons.ExclamationTriangle className="w-6 h-6 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              Debes iniciar sesión para confirmar la entrega
            </p>
          </div>
        )}

        {/* Botón confirmar */}
        <button
          onClick={confirmarEntrega}
          disabled={procesando}
          className="w-full btn-primary py-4 text-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {procesando ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              Procesando...
            </>
          ) : (
            <>
              <Icons.CheckCircle className="w-6 h-6" />
              Confirmar Recepción
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Al confirmar, los productos se agregarán automáticamente a tu stock
        </p>
      </div>
    </div>
  );
}
