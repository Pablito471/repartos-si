import ClienteLayout from "@/components/layouts/ClienteLayout";
import { useCliente } from "@/context/ClienteContext";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  verificarDisponibilidadHorario,
  formatDiasLaborales,
} from "@/utils/formatters";
import StarRating from "@/components/StarRating";
import CalificarModal from "@/components/CalificarModal";

export default function Depositos() {
  const { depositos, cargandoDepositos } = useCliente();
  const { usuarios, getPromedioCalificaciones, getCalificacionesUsuario } =
    useAuth();
  const [filtro, setFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [depositoACalificar, setDepositoACalificar] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [calificacionesData, setCalificacionesData] = useState({});

  // Cargar calificaciones de todos los depósitos
  useEffect(() => {
    const cargarCalificaciones = async () => {
      const data = {};
      for (const deposito of depositos) {
        const [promedio, calificaciones] = await Promise.all([
          getPromedioCalificaciones(deposito.id),
          getCalificacionesUsuario(deposito.id),
        ]);
        data[deposito.id] = {
          promedio: promedio || 0,
          total: Array.isArray(calificaciones) ? calificaciones.length : 0,
        };
      }
      setCalificacionesData(data);
    };
    if (depositos.length > 0) {
      cargarCalificaciones();
    }
  }, [
    depositos,
    refreshKey,
    getPromedioCalificaciones,
    getCalificacionesUsuario,
  ]);

  // Obtener usuario completo del depósito
  const getUsuarioDeposito = (depositoId) => {
    return usuarios.find(
      (u) => u.tipoUsuario === "deposito" && u.id === depositoId,
    );
  };

  const depositosFiltrados = depositos.filter((deposito) => {
    const cumpleFiltro =
      filtro === "todos" ||
      (filtro === "disponibles" && deposito.disponible) ||
      (filtro === "no_disponibles" && !deposito.disponible);

    const cumpleBusqueda =
      deposito.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      deposito.direccion.toLowerCase().includes(busqueda.toLowerCase());

    return cumpleFiltro && cumpleBusqueda;
  });

  // Mostrar loading mientras se cargan los depósitos
  if (cargandoDepositos) {
    return (
      <ClienteLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-600">Cargando depósitos...</span>
        </div>
      </ClienteLayout>
    );
  }

  return (
    <ClienteLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Depósitos</h1>
          <p className="text-gray-600">
            Consulta los depósitos disponibles para tus pedidos
          </p>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Buscar por nombre o dirección..."
                className="input-field"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                className="input-field"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="disponibles">Disponibles</option>
                <option value="no_disponibles">No disponibles</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Disponibles</p>
                <p className="text-3xl font-bold">
                  {depositos.filter((d) => d.disponible).length}
                </p>
              </div>
              <span className="text-4xl opacity-80">✅</span>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">No Disponibles</p>
                <p className="text-3xl font-bold">
                  {depositos.filter((d) => !d.disponible).length}
                </p>
              </div>
              <span className="text-4xl opacity-80">❌</span>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Depósitos</p>
                <p className="text-3xl font-bold">{depositos.length}</p>
              </div>
              <span className="text-4xl opacity-80">🏭</span>
            </div>
          </div>
        </div>

        {/* Deposits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {depositosFiltrados.length === 0 ? (
            <div className="md:col-span-2 card text-center py-12">
              <span className="text-6xl mb-4 block">🏭</span>
              <h3 className="text-xl font-semibold text-gray-700">
                No hay depósitos
              </h3>
              <p className="text-gray-500 mt-2">
                No se encontraron depósitos con los filtros aplicados
              </p>
            </div>
          ) : (
            depositosFiltrados.map((deposito) => (
              <DepositoCard
                key={deposito.id}
                deposito={deposito}
                usuarioDeposito={getUsuarioDeposito(deposito.id)}
                promedio={calificacionesData[deposito.id]?.promedio || 0}
                totalCalificaciones={
                  calificacionesData[deposito.id]?.total || 0
                }
                onCalificar={() =>
                  setDepositoACalificar(getUsuarioDeposito(deposito.id))
                }
              />
            ))
          )}
        </div>

        {/* Info */}
        <div className="card bg-blue-50 border border-blue-200">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <h3 className="font-semibold text-blue-800">
                ¿Cómo funcionan los depósitos?
              </h3>
              <p className="text-blue-700 mt-1">
                Los depósitos son los puntos de origen de tus pedidos. Al crear
                un nuevo pedido, podrás elegir el depósito más conveniente según
                tu ubicación y el tipo de envío que prefieras. Cada depósito
                ofrece diferentes opciones de envío y horarios de atención.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de calificación */}
      {depositoACalificar && (
        <CalificarModal
          usuario={depositoACalificar}
          onClose={() => setDepositoACalificar(null)}
          onCalificado={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </ClienteLayout>
  );
}

function DepositoCard({
  deposito,
  usuarioDeposito,
  promedio,
  totalCalificaciones,
  onCalificar,
}) {
  const [estadoHorario, setEstadoHorario] = useState(null);

  // Actualizar el estado del horario cada minuto
  useEffect(() => {
    const actualizarEstado = () => {
      const estado = verificarDisponibilidadHorario(
        deposito.horarioApertura,
        deposito.horarioCierre,
        deposito.diasLaborales,
      );
      setEstadoHorario(estado);
    };

    actualizarEstado();
    const interval = setInterval(actualizarEstado, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, [deposito]);

  const tipoEnvioInfo = {
    envio: { icon: "🚚", texto: "Envío a domicilio" },
    flete: { icon: "🚛", texto: "Flete" },
    retiro: { icon: "🏭", texto: "Retiro en depósito" },
  };

  const totalProductos = deposito.productos?.length || 0;
  const categorias = [
    ...new Set(deposito.productos?.map((p) => p.categoria) || []),
  ];

  // Determinar si está realmente disponible (configuración + horario)
  const estaAbierto = deposito.disponible && estadoHorario?.abierto;
  const puedeHacerPedido = deposito.disponible && estadoHorario?.disponible;

  return (
    <div
      className={`card border-2 ${estaAbierto ? "border-green-200" : estadoHorario?.disponible ? "border-yellow-200" : "border-red-200"}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <span className="text-5xl">{deposito.imagen}</span>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <h3 className="text-lg font-semibold text-gray-800">
                {deposito.nombre}
              </h3>
              {!deposito.disponible ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  No disponible
                </span>
              ) : estadoHorario?.abierto ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Abierto ahora
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {estadoHorario?.mensaje}
                </span>
              )}
            </div>
            <p className="text-gray-600 mt-1">📍 {deposito.direccion}</p>
            <p className="text-gray-600">📞 {deposito.telefono}</p>

            {/* Horario estructurado */}
            <div className="mt-2 p-2 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                🕐 {formatDiasLaborales(deposito.diasLaborales)}{" "}
                {deposito.horarioApertura} - {deposito.horarioCierre}
              </p>
              {estadoHorario &&
                !estadoHorario.abierto &&
                estadoHorario.disponible && (
                  <p className="text-xs text-yellow-600 mt-1">
                    ⏰ {estadoHorario.detalle}
                  </p>
                )}
              {estadoHorario?.abierto && (
                <p className="text-xs text-green-600 mt-1">
                  ✅ {estadoHorario.detalle}
                </p>
              )}
            </div>

            {/* Calificación */}
            <div className="mt-2 flex items-center gap-2">
              <StarRating rating={promedio} size="sm" />
              <span className="text-sm text-gray-500">
                ({totalCalificaciones}{" "}
                {totalCalificaciones === 1 ? "reseña" : "reseñas"})
              </span>
              {usuarioDeposito && (
                <button
                  onClick={onCalificar}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium ml-1"
                >
                  Calificar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products Info */}
      {puedeHacerPedido && totalProductos > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">
              📦 {totalProductos} productos disponibles
            </p>
            <p className="text-sm text-gray-500">
              {categorias.length} categorías
            </p>
          </div>
          <Link
            href={`/clientes/depositos/${deposito.id}/productos`}
            className="w-full block text-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
          >
            🛍️ Ver productos
          </Link>
        </div>
      )}

      {/* Shipping Types */}
      <div className="mt-4 pt-4 border-t">
        <p className="text-sm font-medium text-gray-700 mb-2">
          Tipos de envío disponibles:
        </p>
        <div className="flex flex-wrap gap-2">
          {deposito.tiposEnvio.map((tipo) => (
            <span
              key={tipo}
              className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700 flex items-center space-x-1"
            >
              <span>{tipoEnvioInfo[tipo].icon}</span>
              <span>{tipoEnvioInfo[tipo].texto}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Action */}
      {puedeHacerPedido ? (
        <div className="mt-4">
          <Link
            href={`/clientes/pedidos/nuevo?deposito=${deposito.id}`}
            className={`w-full text-center block px-4 py-3 rounded-lg font-medium transition-colors ${
              estaAbierto
                ? "btn-primary"
                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
            }`}
          >
            {estaAbierto
              ? "Hacer pedido desde este depósito"
              : "📝 Programar pedido (abre " +
                (estadoHorario?.proximaApertura || "pronto") +
                ")"}
          </Link>
        </div>
      ) : (
        <div className="mt-4">
          <div className="w-full text-center px-4 py-3 rounded-lg bg-gray-100 text-gray-500">
            🚫 No disponible para pedidos
          </div>
        </div>
      )}
    </div>
  );
}
