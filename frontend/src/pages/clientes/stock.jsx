import ClienteLayout from "@/components/layouts/ClienteLayout";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import Icons from "@/components/Icons";

export default function StockCliente() {
  const { usuario } = useAuth();
  const [stock, setStock] = useState([]);
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    if (usuario) {
      cargarStock();
      cargarHistorial();
    }
  }, [usuario]);

  const cargarStock = () => {
    const stockClientes = JSON.parse(
      localStorage.getItem("repartos_stock_clientes") || "{}",
    );
    setStock(stockClientes[usuario?.id] || []);
  };

  const cargarHistorial = () => {
    const entregasConfirmadas = JSON.parse(
      localStorage.getItem("repartos_entregas_confirmadas") || "[]",
    );
    const misEntregas = entregasConfirmadas.filter(
      (e) => e.clienteConfirmo === usuario?.id,
    );
    setHistorial(misEntregas);
  };

  const calcularTotalStock = () => {
    return stock.reduce((sum, p) => sum + p.cantidad, 0);
  };

  const calcularValorTotal = () => {
    return stock.reduce((sum, p) => sum + p.cantidad * p.precio, 0);
  };

  return (
    <ClienteLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mi Stock</h1>
          <p className="text-gray-600">
            Productos recibidos y confirmados mediante QR
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Icons.Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Productos</p>
                <p className="text-2xl font-bold text-gray-800">
                  {calcularTotalStock()}
                </p>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-50 to-green-100/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                <Icons.Currency className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-gray-800">
                  ${calcularValorTotal().toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-blue-50 to-blue-100/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                <Icons.CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Entregas Confirmadas</p>
                <p className="text-2xl font-bold text-gray-800">
                  {historial.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stock actual */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Icons.Package className="w-5 h-5 text-primary" />
            Inventario Actual
          </h2>

          {stock.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Icons.Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                Sin productos en stock
              </h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Cuando recibas tus pedidos y escanees el código QR del
                comprobante, los productos aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-500 text-sm border-b">
                    <th className="pb-3">Producto</th>
                    <th className="pb-3 text-center">Cantidad</th>
                    <th className="pb-3 text-right">Precio Unit.</th>
                    <th className="pb-3 text-right">Valor Total</th>
                    <th className="pb-3 text-right">Última Actualización</th>
                  </tr>
                </thead>
                <tbody>
                  {stock.map((producto, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="py-4">
                        <p className="font-medium text-gray-800">
                          {producto.nombre}
                        </p>
                      </td>
                      <td className="py-4 text-center">
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                          {producto.cantidad}
                        </span>
                      </td>
                      <td className="py-4 text-right text-gray-600">
                        ${producto.precio?.toLocaleString()}
                      </td>
                      <td className="py-4 text-right font-semibold text-gray-800">
                        $
                        {(producto.cantidad * producto.precio).toLocaleString()}
                      </td>
                      <td className="py-4 text-right text-sm text-gray-500">
                        {producto.ultimaActualizacion
                          ? new Date(
                              producto.ultimaActualizacion,
                            ).toLocaleDateString("es-ES")
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="py-4 font-semibold">
                      Total en Stock
                    </td>
                    <td className="py-4 text-right text-xl font-bold text-primary">
                      ${calcularValorTotal().toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Historial de entregas */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Icons.Clock className="w-5 h-5 text-primary" />
            Historial de Entregas Confirmadas
          </h2>

          {historial.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <Icons.QrCode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay entregas confirmadas aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historial.map((entrega, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Icons.CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        Pedido #{entrega.pedidoId}
                      </p>
                      <p className="text-sm text-gray-500">
                        {entrega.productos?.length} productos -{" "}
                        {entrega.deposito}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">
                      ${entrega.total?.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(entrega.fechaConfirmacion).toLocaleDateString(
                        "es-ES",
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <Icons.QrCode className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-800 mb-1">
                ¿Cómo funciona?
              </h3>
              <p className="text-sm text-blue-700">
                Cuando recibes un pedido, el transportista te entregará un
                comprobante con un código QR. Al escanearlo con tu celular, los
                productos se agregarán automáticamente a tu stock.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ClienteLayout>
  );
}
