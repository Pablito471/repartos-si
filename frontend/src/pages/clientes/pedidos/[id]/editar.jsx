import ClienteLayout from "@/components/layouts/ClienteLayout";
import { useCliente } from "@/context/ClienteContext";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import {
  showSuccessAlert,
  showErrorAlert,
  showConfirmAlert,
} from "@/utils/alerts";

export default function EditarPedido() {
  const router = useRouter();
  const { id } = router.query;
  const { pedidos, productos, depositos, modificarPedido, cancelarPedido } =
    useCliente();

  const [pedido, setPedido] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (id) {
      const pedidoEncontrado = pedidos.find((p) => String(p.id) === String(id));
      if (pedidoEncontrado) {
        setPedido({
          ...pedidoEncontrado,
          productos: pedidoEncontrado.productos.map((p) => {
            const productoCompleto = productos.find(
              (prod) => prod.nombre === p.nombre,
            );
            return {
              ...p,
              id: productoCompleto?.id || Math.random(),
            };
          }),
        });
      }
      setCargando(false);
    }
  }, [id, pedidos, productos]);

  if (cargando) {
    return (
      <ClienteLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </ClienteLayout>
    );
  }

  if (!pedido) {
    return (
      <ClienteLayout>
        <div className="card text-center py-12">
          <span className="text-6xl mb-4 block">❌</span>
          <h2 className="text-xl font-semibold text-gray-700">
            Pedido no encontrado
          </h2>
          <p className="text-gray-500 mt-2">El pedido que buscas no existe</p>
          <button
            onClick={() => router.push("/clientes/pedidos")}
            className="btn-primary mt-4"
          >
            Volver a mis pedidos
          </button>
        </div>
      </ClienteLayout>
    );
  }

  if (pedido.estado !== "pendiente") {
    return (
      <ClienteLayout>
        <div className="card text-center py-12">
          <span className="text-6xl mb-4 block">⚠️</span>
          <h2 className="text-xl font-semibold text-gray-700">
            No se puede modificar
          </h2>
          <p className="text-gray-500 mt-2">
            Solo puedes modificar pedidos en estado pendiente
          </p>
          <button
            onClick={() => router.push("/clientes/pedidos")}
            className="btn-primary mt-4"
          >
            Volver a mis pedidos
          </button>
        </div>
      </ClienteLayout>
    );
  }

  const agregarProducto = (productoId) => {
    const producto = productos.find((p) => String(p.id) === String(productoId));
    if (!producto) return;

    const existe = pedido.productos.find((p) => p.nombre === producto.nombre);
    if (existe) {
      setPedido({
        ...pedido,
        productos: pedido.productos.map((p) =>
          p.nombre === producto.nombre ? { ...p, cantidad: p.cantidad + 1 } : p,
        ),
      });
    } else {
      setPedido({
        ...pedido,
        productos: [
          ...pedido.productos,
          {
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1,
          },
        ],
      });
    }
  };

  const actualizarCantidad = (productoNombre, cantidad) => {
    if (cantidad < 1) {
      setPedido({
        ...pedido,
        productos: pedido.productos.filter((p) => p.nombre !== productoNombre),
      });
    } else {
      setPedido({
        ...pedido,
        productos: pedido.productos.map((p) =>
          p.nombre === productoNombre ? { ...p, cantidad } : p,
        ),
      });
    }
  };

  const eliminarProducto = (productoNombre) => {
    setPedido({
      ...pedido,
      productos: pedido.productos.filter((p) => p.nombre !== productoNombre),
    });
  };

  const calcularTotal = () => {
    return pedido.productos.reduce((sum, p) => sum + p.precio * p.cantidad, 0);
  };

  const handleGuardar = async () => {
    if (pedido.productos.length === 0) {
      showErrorAlert("Error", "Debes agregar al menos un producto");
      return;
    }

    const confirmado = await showConfirmAlert(
      "Guardar cambios",
      "¿Deseas guardar los cambios en este pedido?",
    );

    if (confirmado) {
      const resultado = await modificarPedido(id, {
        productos: pedido.productos.map((p) => ({
          id: p.id,
          productoId: p.id,
          nombre: p.nombre,
          cantidad: p.cantidad,
          precio: p.precio,
        })),
        direccion: pedido.direccion,
        tipoEnvio: pedido.tipoEnvio,
        total: calcularTotal(),
      });

      if (resultado.success) {
        showSuccessAlert("¡Guardado!", "Los cambios han sido guardados");
        router.push("/clientes/pedidos");
      } else {
        showErrorAlert(
          "Error",
          resultado.error || "No se pudieron guardar los cambios",
        );
      }
    }
  };

  const handleCancelar = async () => {
    const confirmado = await showConfirmAlert(
      "¿Cancelar pedido?",
      "Esta acción no se puede deshacer",
    );

    if (confirmado) {
      const resultado = await cancelarPedido(id);
      if (resultado.success) {
        showSuccessAlert("Pedido cancelado", "El pedido ha sido cancelado");
        router.push("/clientes/pedidos");
      } else {
        showErrorAlert(
          "Error",
          resultado.error || "No se pudo cancelar el pedido",
        );
      }
    }
  };

  const tipoEnvioTexto = {
    envio: "🚚 Envío a domicilio",
    flete: "🚛 Flete",
    retiro: "🏭 Retiro en depósito",
  };

  return (
    <ClienteLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Editar Pedido #{id}
            </h1>
            <p className="text-gray-600">Modifica los detalles de tu pedido</p>
          </div>
          <button
            onClick={handleCancelar}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            ❌ Cancelar Pedido
          </button>
        </div>

        {/* Order Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">
              Información del Pedido
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">Depósito</label>
                <p className="font-medium text-gray-800">{pedido.deposito}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Fecha</label>
                <p className="font-medium text-gray-800">{pedido.fecha}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Estado</label>
                <p className="font-medium">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                    Pendiente
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Tipo de Envío</h3>
            <div className="space-y-3">
              <select
                className="input-field"
                value={pedido.tipoEnvio}
                onChange={(e) =>
                  setPedido({ ...pedido, tipoEnvio: e.target.value })
                }
              >
                <option value="envio">🚚 Envío a domicilio</option>
                <option value="flete">🚛 Flete</option>
                <option value="retiro">🏭 Retiro en depósito</option>
              </select>

              {(pedido.tipoEnvio === "envio" ||
                pedido.tipoEnvio === "flete") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección de entrega
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={pedido.direccion}
                    onChange={(e) =>
                      setPedido({ ...pedido, direccion: e.target.value })
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Productos</h3>

          <div className="mb-4">
            <select
              className="input-field"
              onChange={(e) => {
                if (e.target.value) agregarProducto(e.target.value);
                e.target.value = "";
              }}
            >
              <option value="">Agregar producto...</option>
              {productos.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.nombre} - ${prod.precio}
                </option>
              ))}
            </select>
          </div>

          {pedido.productos.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <span className="text-4xl">🛒</span>
              <p className="text-gray-500 mt-2">Agrega productos al pedido</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pedido.productos.map((prod, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-800">{prod.nombre}</p>
                    <p className="text-sm text-gray-500">${prod.precio} c/u</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          actualizarCantidad(prod.nombre, prod.cantidad - 1)
                        }
                        className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-medium">
                        {prod.cantidad}
                      </span>
                      <button
                        onClick={() =>
                          actualizarCantidad(prod.nombre, prod.cantidad + 1)
                        }
                        className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>
                    <p className="font-bold text-gray-800 w-24 text-right">
                      ${(prod.precio * prod.cantidad).toLocaleString()}
                    </p>
                    <button
                      onClick={() => eliminarProducto(prod.nombre)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t mt-4">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span>Total:</span>
                  <span className="text-primary">
                    ${calcularTotal().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <button
            onClick={() => router.push("/clientes/pedidos")}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            ← Volver
          </button>
          <button onClick={handleGuardar} className="btn-primary px-8 py-2">
            💾 Guardar Cambios
          </button>
        </div>
      </div>
    </ClienteLayout>
  );
}
