import ClienteLayout from "@/components/layouts/ClienteLayout";
import { useCliente } from "@/context/ClienteContext";
import { useDeposito } from "@/context/DepositoContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { formatNumber } from "@/utils/formatters";
import {
  showSuccessAlert,
  showErrorAlert,
  showConfirmAlert,
} from "@/utils/alerts";

export default function NuevoPedido() {
  const router = useRouter();
  const {
    depositos,
    productos,
    crearPedido,
    carrito,
    vaciarCarrito,
    getDepositosEnCarrito,
    getProductosPorDeposito,
    eliminarDelCarrito,
    actualizarCantidadCarrito,
  } = useCliente();

  const { recibirPedidoCliente } = useDeposito();

  const [paso, setPaso] = useState(1);
  const [pedido, setPedido] = useState({
    tipoEnvio: "",
    direccion: "",
    productos: [], // Productos del carrito con depositoId
    notas: "",
  });

  // Cargar productos del carrito al iniciar
  useEffect(() => {
    if (carrito.productos.length > 0) {
      setPedido((prev) => ({
        ...prev,
        productos: carrito.productos.map((p) => ({
          ...p,
        })),
      }));
    }
  }, []); // Solo al montar

  const depositosEnCarrito = getDepositosEnCarrito();

  const actualizarCantidad = (productoId, depositoId, cantidad) => {
    if (cantidad < 1) {
      setPedido({
        ...pedido,
        productos: pedido.productos.filter(
          (p) => !(p.id === productoId && p.depositoId === depositoId),
        ),
      });
      eliminarDelCarrito(productoId, depositoId);
    } else {
      setPedido({
        ...pedido,
        productos: pedido.productos.map((p) =>
          p.id === productoId && p.depositoId === depositoId
            ? { ...p, cantidad }
            : p,
        ),
      });
      actualizarCantidadCarrito(productoId, depositoId, cantidad);
    }
  };

  const eliminarProducto = (productoId, depositoId) => {
    setPedido({
      ...pedido,
      productos: pedido.productos.filter(
        (p) => !(p.id === productoId && p.depositoId === depositoId),
      ),
    });
    eliminarDelCarrito(productoId, depositoId);
  };

  const calcularTotal = () => {
    return pedido.productos.reduce((sum, p) => sum + p.precio * p.cantidad, 0);
  };

  const calcularTotalPorDeposito = (depositoId) => {
    return pedido.productos
      .filter((p) => p.depositoId === depositoId)
      .reduce((sum, p) => sum + p.precio * p.cantidad, 0);
  };

  const getProductosDeDeposito = (depositoId) => {
    return pedido.productos.filter((p) => p.depositoId === depositoId);
  };

  const validarPaso = (numPaso) => {
    switch (numPaso) {
      case 1:
        return pedido.productos.length > 0;
      case 2:
        return (
          pedido.tipoEnvio !== "" &&
          (pedido.tipoEnvio === "retiro" || pedido.direccion !== "")
        );
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    const confirmado = await showConfirmAlert(
      "Confirmar pedido",
      `¿Deseas confirmar el pedido por $${formatNumber(calcularTotal())}?`,
    );

    if (confirmado) {
      // Crear un pedido por cada depósito
      const depositosIds = [
        ...new Set(pedido.productos.map((p) => p.depositoId)),
      ];

      for (const depositoId of depositosIds) {
        const deposito = depositos.find((d) => d.id === depositoId);
        const productosDeposito = getProductosDeDeposito(depositoId);

        const nuevoPedido = {
          deposito: deposito.nombre,
          depositoId: depositoId,
          tipoEnvio: pedido.tipoEnvio,
          direccion: pedido.direccion || deposito.direccion,
          productos: productosDeposito.map((p) => ({
            nombre: p.nombre,
            cantidad: p.cantidad,
            precio: p.precio,
          })),
          total: calcularTotalPorDeposito(depositoId),
          notas: pedido.notas,
        };

        // Crear pedido en el contexto del cliente
        crearPedido(nuevoPedido);

        // Enviar notificación al depósito correspondiente
        recibirPedidoCliente({
          clienteId: "CLI-12345",
          cliente: "Mi Local", // Nombre del cliente actual
          tipoEnvio: pedido.tipoEnvio,
          direccion: pedido.direccion || deposito.direccion,
          productos: productosDeposito.map((p) => ({
            nombre: p.nombre,
            cantidad: p.cantidad,
            precio: p.precio,
          })),
          total: calcularTotalPorDeposito(depositoId),
          notas: pedido.notas,
        });
      }

      vaciarCarrito();
      showSuccessAlert(
        "¡Pedido creado!",
        depositosIds.length > 1
          ? `Se han creado ${depositosIds.length} pedidos y notificado a cada depósito`
          : "Tu pedido ha sido registrado y el depósito ha sido notificado",
      );
      router.push("/clientes/pedidos");
    }
  };

  return (
    <ClienteLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nuevo Pedido</h1>
          <p className="text-gray-600">
            Completa los pasos para crear tu pedido
          </p>
        </div>

        {/* Progress Steps */}
        <div className="card">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    paso >= num
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {num}
                </div>
                {num < 3 && (
                  <div
                    className={`hidden md:block w-32 lg:w-48 h-1 mx-2 ${
                      paso > num ? "bg-primary" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs md:text-sm text-gray-600">
            <span>Productos</span>
            <span>Envío</span>
            <span>Confirmar</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="card">
          {/* Step 1: Review Products from Cart */}
          {paso === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Productos del Carrito
              </h2>
              <p className="text-gray-600">
                Revisa los productos agregados desde los diferentes depósitos
              </p>

              {pedido.productos.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <span className="text-6xl block mb-4">🛒</span>
                  <h3 className="text-xl font-semibold text-gray-700">
                    Tu carrito está vacío
                  </h3>
                  <p className="text-gray-500 mt-2">
                    Agrega productos desde los depósitos para crear un pedido
                  </p>
                  <a
                    href="/clientes/depositos"
                    className="btn-primary mt-4 inline-block"
                  >
                    Ver Depósitos
                  </a>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Productos agrupados por depósito */}
                  {depositosEnCarrito.map((deposito) => (
                    <div
                      key={deposito.id}
                      className="border rounded-lg overflow-hidden"
                    >
                      <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{deposito.imagen}</span>
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {deposito.nombre}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {deposito.direccion}
                            </p>
                          </div>
                        </div>
                        <span className="text-primary font-bold">
                          ${formatNumber(calcularTotalPorDeposito(deposito.id))}
                        </span>
                      </div>

                      <div className="p-4 space-y-3">
                        {getProductosDeDeposito(deposito.id).map((prod) => (
                          <div
                            key={`${prod.id}-${prod.depositoId}`}
                            className="flex items-center justify-between bg-white p-3 rounded-lg border"
                          >
                            <div className="flex items-center gap-3">
                              {prod.imagen ? (
                                <img
                                  src={prod.imagen}
                                  alt={prod.nombre}
                                  className="w-12 h-12 rounded object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                                  <span className="text-xl">📦</span>
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-gray-800">
                                  {prod.nombre}
                                </p>
                                <p className="text-sm text-gray-500">
                                  ${formatNumber(prod.precio)} c/u
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() =>
                                    actualizarCantidad(
                                      prod.id,
                                      prod.depositoId,
                                      prod.cantidad - 1,
                                    )
                                  }
                                  className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                                >
                                  -
                                </button>
                                <span className="w-10 text-center font-medium">
                                  {prod.cantidad}
                                </span>
                                <button
                                  onClick={() =>
                                    actualizarCantidad(
                                      prod.id,
                                      prod.depositoId,
                                      prod.cantidad + 1,
                                    )
                                  }
                                  className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                                >
                                  +
                                </button>
                              </div>

                              <p className="font-bold text-gray-800 w-24 text-right">
                                ${formatNumber(prod.precio * prod.cantidad)}
                              </p>

                              <button
                                onClick={() =>
                                  eliminarProducto(prod.id, prod.depositoId)
                                }
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Total general */}
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-gray-600">
                          {depositosEnCarrito.length > 1
                            ? `Se crearán ${depositosEnCarrito.length} pedidos (uno por depósito)`
                            : "Total del pedido"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {pedido.productos.reduce(
                            (sum, p) => sum + p.cantidad,
                            0,
                          )}{" "}
                          productos en total
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-primary">
                        ${formatNumber(calcularTotal())}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Shipping */}
          {paso === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Tipo de Envío
              </h2>
              <p className="text-gray-600">
                Selecciona cómo deseas recibir tus pedidos
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div
                  onClick={() => setPedido({ ...pedido, tipoEnvio: "envio" })}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all text-center ${
                    pedido.tipoEnvio === "envio"
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-4xl block mb-2">🚚</span>
                  <h3 className="font-semibold text-gray-800">
                    Envío a Domicilio
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Entrega en tu dirección
                  </p>
                </div>

                <div
                  onClick={() => setPedido({ ...pedido, tipoEnvio: "flete" })}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all text-center ${
                    pedido.tipoEnvio === "flete"
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-4xl block mb-2">🚛</span>
                  <h3 className="font-semibold text-gray-800">Flete</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Contrata un flete para cargas grandes
                  </p>
                </div>

                <div
                  onClick={() => setPedido({ ...pedido, tipoEnvio: "retiro" })}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all text-center ${
                    pedido.tipoEnvio === "retiro"
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-4xl block mb-2">🏭</span>
                  <h3 className="font-semibold text-gray-800">
                    Retiro en Depósito
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Recoge tu pedido en cada depósito
                  </p>
                </div>
              </div>

              {(pedido.tipoEnvio === "envio" ||
                pedido.tipoEnvio === "flete") && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección de entrega
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ingresa tu dirección completa"
                    value={pedido.direccion}
                    onChange={(e) =>
                      setPedido({ ...pedido, direccion: e.target.value })
                    }
                  />
                </div>
              )}

              {pedido.tipoEnvio === "retiro" &&
                depositosEnCarrito.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <p className="text-sm font-medium text-gray-700">
                      Direcciones de retiro:
                    </p>
                    {depositosEnCarrito.map((deposito) => (
                      <div
                        key={deposito.id}
                        className="p-4 bg-blue-50 rounded-lg flex items-center gap-3"
                      >
                        <span className="text-2xl">{deposito.imagen}</span>
                        <div>
                          <p className="font-medium text-blue-800">
                            {deposito.nombre}
                          </p>
                          <p className="text-blue-600 text-sm">
                            📍 {deposito.direccion}
                          </p>
                          <p className="text-blue-600 text-sm">
                            🕐 {deposito.horario}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              {/* Notes */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas adicionales (opcional)
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Instrucciones especiales para tu pedido..."
                  value={pedido.notas}
                  onChange={(e) =>
                    setPedido({ ...pedido, notas: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {paso === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-800">
                Confirmar Pedido
              </h2>
              <p className="text-gray-600">
                Revisa los detalles de tu pedido antes de confirmar
              </p>

              {/* Info de envío */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">
                  🚚 Tipo de Envío
                </h3>
                <p className="text-gray-800">
                  {pedido.tipoEnvio === "envio"
                    ? "Envío a Domicilio"
                    : pedido.tipoEnvio === "flete"
                      ? "Flete"
                      : "Retiro en Depósito"}
                </p>
                {pedido.direccion && (
                  <p className="text-sm text-gray-500 mt-1">
                    Dirección: {pedido.direccion}
                  </p>
                )}
              </div>

              {/* Pedidos por depósito */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700">
                  📦 Resumen de Pedidos ({depositosEnCarrito.length})
                </h3>

                {depositosEnCarrito.map((deposito, index) => (
                  <div
                    key={deposito.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div className="bg-primary/10 px-4 py-2 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </span>
                          <span className="text-xl">{deposito.imagen}</span>
                          <span className="font-semibold">
                            {deposito.nombre}
                          </span>
                        </div>
                        <span className="font-bold text-primary">
                          ${formatNumber(calcularTotalPorDeposito(deposito.id))}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      {getProductosDeDeposito(deposito.id).map((prod) => (
                        <div
                          key={`${prod.id}-${prod.depositoId}`}
                          className="flex justify-between text-sm py-1"
                        >
                          <span className="text-gray-600">
                            {prod.nombre} x{prod.cantidad}
                          </span>
                          <span className="font-medium">
                            ${formatNumber(prod.precio * prod.cantidad)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total general */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-green-800">
                      Total General
                    </p>
                    <p className="text-sm text-green-600">
                      {depositosEnCarrito.length > 1
                        ? `${depositosEnCarrito.length} pedidos`
                        : "1 pedido"}{" "}
                      -{" "}
                      {pedido.productos.reduce((sum, p) => sum + p.cantidad, 0)}{" "}
                      productos
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    ${formatNumber(calcularTotal())}
                  </p>
                </div>
              </div>

              {pedido.notas && (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-1">📝 Notas</h3>
                  <p className="text-gray-600">{pedido.notas}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={() => setPaso(paso - 1)}
            disabled={paso === 1}
            className={`px-6 py-2 rounded-lg transition-colors ${
              paso === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            ← Anterior
          </button>

          {paso < 3 ? (
            <button
              onClick={() => setPaso(paso + 1)}
              disabled={!validarPaso(paso)}
              className={`px-6 py-2 rounded-lg transition-colors ${
                validarPaso(paso)
                  ? "btn-primary"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              Siguiente →
            </button>
          ) : (
            <button onClick={handleSubmit} className="btn-primary px-8 py-2">
              ✓ Confirmar Pedido
            </button>
          )}
        </div>
      </div>
    </ClienteLayout>
  );
}
