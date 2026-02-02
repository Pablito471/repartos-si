import DepositoLayout from "@/components/layouts/DepositoLayout";
import { useDeposito } from "@/context/DepositoContext";
import { useState } from "react";
import { showSuccessAlert, showConfirmAlert, showToast } from "@/utils/alerts";

export default function Configuracion() {
  const { vehiculos, conductores } = useDeposito();
  const [activeTab, setActiveTab] = useState("general");
  const [configGeneral, setConfigGeneral] = useState({
    nombreDeposito: "Depósito Central",
    direccion: "Av. Industrial 1234",
    telefono: "+54 11 5555-0000",
    email: "deposito@repartossi.com",
    horarioApertura: "08:00",
    horarioCierre: "18:00",
    capacidadMaxima: 1000,
    alertaStockMinimo: 10,
  });

  const [mostrarModalVehiculo, setMostrarModalVehiculo] = useState(false);
  const [mostrarModalConductor, setMostrarModalConductor] = useState(false);
  const [nuevoVehiculo, setNuevoVehiculo] = useState({
    nombre: "",
    tipo: "camioneta",
    patente: "",
    capacidad: "",
  });
  const [nuevoConductor, setNuevoConductor] = useState({
    nombre: "",
    telefono: "",
    licencia: "",
  });

  const handleGuardarConfig = () => {
    showSuccessAlert(
      "¡Configuración guardada!",
      "Los cambios han sido aplicados",
    );
  };

  const handleAgregarVehiculo = (e) => {
    e.preventDefault();
    if (!nuevoVehiculo.nombre || !nuevoVehiculo.patente) {
      showToast("error", "Completa los campos requeridos");
      return;
    }
    showSuccessAlert(
      "¡Vehículo agregado!",
      `${nuevoVehiculo.nombre} añadido a la flota`,
    );
    setMostrarModalVehiculo(false);
    setNuevoVehiculo({
      nombre: "",
      tipo: "camioneta",
      patente: "",
      capacidad: "",
    });
  };

  const handleAgregarConductor = (e) => {
    e.preventDefault();
    if (!nuevoConductor.nombre || !nuevoConductor.telefono) {
      showToast("error", "Completa los campos requeridos");
      return;
    }
    showSuccessAlert(
      "¡Conductor agregado!",
      `${nuevoConductor.nombre} añadido al equipo`,
    );
    setMostrarModalConductor(false);
    setNuevoConductor({ nombre: "", telefono: "", licencia: "" });
  };

  const handleEliminar = async (tipo, nombre) => {
    const confirmado = await showConfirmAlert(
      `Eliminar ${tipo}`,
      `¿Estás seguro de eliminar "${nombre}"? Esta acción no se puede deshacer.`,
    );
    if (confirmado) {
      showToast("success", `${tipo} eliminado correctamente`);
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: "⚙️" },
    { id: "vehiculos", label: "Vehículos", icon: "🚛" },
    { id: "conductores", label: "Conductores", icon: "👤" },
    { id: "notificaciones", label: "Notificaciones", icon: "🔔" },
    { id: "integraciones", label: "Integraciones", icon: "🔗" },
  ];

  return (
    <DepositoLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>
          <p className="text-gray-600">
            Administra las opciones y recursos del depósito
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "general" && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">
              Información General del Depósito
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Depósito
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={configGeneral.nombreDeposito}
                  onChange={(e) =>
                    setConfigGeneral({
                      ...configGeneral,
                      nombreDeposito: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={configGeneral.direccion}
                  onChange={(e) =>
                    setConfigGeneral({
                      ...configGeneral,
                      direccion: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  className="input-field"
                  value={configGeneral.telefono}
                  onChange={(e) =>
                    setConfigGeneral({
                      ...configGeneral,
                      telefono: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="input-field"
                  value={configGeneral.email}
                  onChange={(e) =>
                    setConfigGeneral({
                      ...configGeneral,
                      email: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horario de Apertura
                </label>
                <input
                  type="time"
                  className="input-field"
                  value={configGeneral.horarioApertura}
                  onChange={(e) =>
                    setConfigGeneral({
                      ...configGeneral,
                      horarioApertura: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horario de Cierre
                </label>
                <input
                  type="time"
                  className="input-field"
                  value={configGeneral.horarioCierre}
                  onChange={(e) =>
                    setConfigGeneral({
                      ...configGeneral,
                      horarioCierre: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidad Máxima (unidades)
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={configGeneral.capacidadMaxima}
                  onChange={(e) =>
                    setConfigGeneral({
                      ...configGeneral,
                      capacidadMaxima: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alerta Stock Mínimo
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={configGeneral.alertaStockMinimo}
                  onChange={(e) =>
                    setConfigGeneral({
                      ...configGeneral,
                      alertaStockMinimo: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t flex justify-end">
              <button onClick={handleGuardarConfig} className="btn-primary">
                💾 Guardar Cambios
              </button>
            </div>
          </div>
        )}

        {activeTab === "vehiculos" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Flota de Vehículos
              </h2>
              <button
                onClick={() => setMostrarModalVehiculo(true)}
                className="btn-primary inline-flex items-center space-x-2"
              >
                <span>➕</span>
                <span>Agregar Vehículo</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehiculos.map((vehiculo) => (
                <div key={vehiculo.id} className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">
                          {vehiculo.tipo === "camioneta"
                            ? "🚐"
                            : vehiculo.tipo === "camion"
                              ? "🚛"
                              : "🏍️"}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {vehiculo.nombre}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {vehiculo.patente}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        vehiculo.estado === "disponible"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {vehiculo.estado === "disponible"
                        ? "Disponible"
                        : "En uso"}
                    </span>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Capacidad:</span>
                      <span className="font-medium text-gray-700">
                        {vehiculo.capacidad}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-500">Tipo:</span>
                      <span className="font-medium text-gray-700 capitalize">
                        {vehiculo.tipo}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() =>
                        handleEliminar("Vehículo", vehiculo.nombre)
                      }
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "conductores" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Equipo de Conductores
              </h2>
              <button
                onClick={() => setMostrarModalConductor(true)}
                className="btn-primary inline-flex items-center space-x-2"
              >
                <span>➕</span>
                <span>Agregar Conductor</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {conductores.map((conductor) => (
                <div key={conductor.id} className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-2xl">👤</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {conductor.nombre}
                        </h3>
                        <p className="text-sm text-gray-500">
                          📞 {conductor.telefono}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        conductor.estado === "disponible"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {conductor.estado === "disponible"
                        ? "Disponible"
                        : "En ruta"}
                    </span>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Licencia:</span>
                      <span className="font-medium text-gray-700">
                        {conductor.licencia}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-500">Entregas hoy:</span>
                      <span className="font-medium text-gray-700">
                        {Math.floor(Math.random() * 10)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() =>
                        handleEliminar("Conductor", conductor.nombre)
                      }
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "notificaciones" && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">
              Preferencias de Notificaciones
            </h2>

            <div className="space-y-4">
              {[
                {
                  id: "nuevoPedido",
                  label: "Nuevo pedido recibido",
                  desc: "Notificar cuando llegue un nuevo pedido",
                },
                {
                  id: "stockBajo",
                  label: "Stock bajo",
                  desc: "Alertar cuando el stock esté por debajo del mínimo",
                },
                {
                  id: "envioEntregado",
                  label: "Envío entregado",
                  desc: "Confirmar cuando se complete una entrega",
                },
                {
                  id: "pedidoCancelado",
                  label: "Pedido cancelado",
                  desc: "Notificar cancelaciones de pedidos",
                },
                {
                  id: "reporteDiario",
                  label: "Reporte diario",
                  desc: "Recibir resumen diario de operaciones",
                },
              ].map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-800">{notif.label}</p>
                    <p className="text-sm text-gray-500">{notif.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t flex justify-end">
              <button onClick={handleGuardarConfig} className="btn-primary">
                💾 Guardar Preferencias
              </button>
            </div>
          </div>
        )}

        {activeTab === "integraciones" && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">
              Integraciones y Conexiones
            </h2>

            <div className="space-y-4">
              {[
                {
                  id: "api",
                  label: "API REST",
                  desc: "Conectar con sistemas externos",
                  icon: "🔌",
                  estado: "activo",
                },
                {
                  id: "whatsapp",
                  label: "WhatsApp Business",
                  desc: "Notificaciones a clientes",
                  icon: "📱",
                  estado: "activo",
                },
                {
                  id: "maps",
                  label: "Google Maps",
                  desc: "Optimización de rutas",
                  icon: "🗺️",
                  estado: "activo",
                },
                {
                  id: "contabilidad",
                  label: "Sistema Contable",
                  desc: "Sincronización de movimientos",
                  icon: "📊",
                  estado: "inactivo",
                },
                {
                  id: "ecommerce",
                  label: "E-commerce",
                  desc: "Integración tienda online",
                  icon: "🛒",
                  estado: "inactivo",
                },
              ].map((integ) => (
                <div
                  key={integ.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                      {integ.icon}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{integ.label}</p>
                      <p className="text-sm text-gray-500">{integ.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        integ.estado === "activo"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {integ.estado === "activo"
                        ? "✓ Conectado"
                        : "No conectado"}
                    </span>
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                      {integ.estado === "activo" ? "Configurar" : "Conectar"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Agregar Vehículo */}
      {mostrarModalVehiculo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  Agregar Vehículo
                </h2>
                <button
                  onClick={() => setMostrarModalVehiculo(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleAgregarVehiculo} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre / Identificación
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ej: Camioneta 01"
                  value={nuevoVehiculo.nombre}
                  onChange={(e) =>
                    setNuevoVehiculo({
                      ...nuevoVehiculo,
                      nombre: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Vehículo
                </label>
                <select
                  className="input-field"
                  value={nuevoVehiculo.tipo}
                  onChange={(e) =>
                    setNuevoVehiculo({ ...nuevoVehiculo, tipo: e.target.value })
                  }
                >
                  <option value="moto">🏍️ Moto</option>
                  <option value="camioneta">🚐 Camioneta</option>
                  <option value="camion">🚛 Camión</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patente
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ej: ABC 123"
                  value={nuevoVehiculo.patente}
                  onChange={(e) =>
                    setNuevoVehiculo({
                      ...nuevoVehiculo,
                      patente: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacidad
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ej: 500 kg"
                  value={nuevoVehiculo.capacidad}
                  onChange={(e) =>
                    setNuevoVehiculo({
                      ...nuevoVehiculo,
                      capacidad: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarModalVehiculo(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  🚛 Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Agregar Conductor */}
      {mostrarModalConductor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  Agregar Conductor
                </h2>
                <button
                  onClick={() => setMostrarModalConductor(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleAgregarConductor} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Nombre y apellido"
                  value={nuevoConductor.nombre}
                  onChange={(e) =>
                    setNuevoConductor({
                      ...nuevoConductor,
                      nombre: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="+54 11 xxxx-xxxx"
                  value={nuevoConductor.telefono}
                  onChange={(e) =>
                    setNuevoConductor({
                      ...nuevoConductor,
                      telefono: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Licencia
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ej: B1-12345678"
                  value={nuevoConductor.licencia}
                  onChange={(e) =>
                    setNuevoConductor({
                      ...nuevoConductor,
                      licencia: e.target.value,
                    })
                  }
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarModalConductor(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  👤 Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DepositoLayout>
  );
}
