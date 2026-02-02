import { useState } from "react";
import FleteLayout from "@/components/layouts/FleteLayout";
import { useFlete } from "@/context/FleteContext";
import { formatNumber, formatDate } from "@/utils/formatters";
import Swal from "sweetalert2";

export default function FleteVehiculo() {
  const { vehiculo, actualizarVehiculo } = useFlete();
  const [editando, setEditando] = useState(false);
  const [datosVehiculo, setDatosVehiculo] = useState(vehiculo);

  const kmRestantes = vehiculo.proximoService - vehiculo.kmActual;
  const porcentajeService = Math.max(
    0,
    Math.min(100, 100 - (kmRestantes / 5000) * 100),
  );

  const handleGuardar = () => {
    if (actualizarVehiculo) {
      actualizarVehiculo(datosVehiculo);
    }
    Swal.fire({
      icon: "success",
      title: "Datos actualizados",
      text: "La información del vehículo ha sido actualizada",
      timer: 2000,
      showConfirmButton: false,
    });
    setEditando(false);
  };

  const registrarKm = async () => {
    const { value: km } = await Swal.fire({
      title: "Registrar Kilometraje",
      input: "number",
      inputLabel: "Kilometraje actual",
      inputValue: vehiculo.kmActual,
      inputPlaceholder: "Ej: 45500",
      showCancelButton: true,
      confirmButtonText: "Registrar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#f97316",
      inputValidator: (value) => {
        if (!value || value < vehiculo.kmActual) {
          return "El kilometraje debe ser mayor al actual";
        }
      },
    });

    if (km) {
      setDatosVehiculo({ ...datosVehiculo, kmActual: parseInt(km) });
      Swal.fire({
        icon: "success",
        title: "Kilometraje actualizado",
        text: `Nuevo kilometraje: ${formatNumber(km)} km`,
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const registrarCargaCombustible = async () => {
    const { value: formValues } = await Swal.fire({
      title: "Registrar Carga de Combustible",
      html: `
        <div class="space-y-4 text-left">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Litros cargados</label>
            <input id="litros" type="number" class="swal2-input w-full" placeholder="Ej: 30">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Monto pagado ($)</label>
            <input id="monto" type="number" class="swal2-input w-full" placeholder="Ej: 15000">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Estación</label>
            <input id="estacion" type="text" class="swal2-input w-full" placeholder="Ej: YPF Centro">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Registrar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#f97316",
      preConfirm: () => {
        const litros = document.getElementById("litros").value;
        const monto = document.getElementById("monto").value;
        const estacion = document.getElementById("estacion").value;
        if (!litros || !monto) {
          Swal.showValidationMessage("Por favor completa litros y monto");
          return false;
        }
        return { litros, monto, estacion };
      },
    });

    if (formValues) {
      Swal.fire({
        icon: "success",
        title: "Carga registrada",
        html: `
          <p>Litros: ${formValues.litros}</p>
          <p>Monto: $${formatNumber(formValues.monto)}</p>
          <p>Precio/litro: $${formatNumber(formValues.monto / formValues.litros)}</p>
        `,
        confirmButtonColor: "#f97316",
      });
    }
  };

  const programarMantenimiento = async () => {
    const { value: fecha } = await Swal.fire({
      title: "Programar Mantenimiento",
      input: "date",
      inputLabel: "Fecha del mantenimiento",
      showCancelButton: true,
      confirmButtonText: "Programar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#f97316",
    });

    if (fecha) {
      Swal.fire({
        icon: "success",
        title: "Mantenimiento programado",
        text: `Se ha programado el mantenimiento para el ${formatDate(fecha)}`,
        confirmButtonColor: "#f97316",
      });
    }
  };

  return (
    <FleteLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Mi Vehículo</h1>
            <p className="text-gray-600">Información y mantenimiento</p>
          </div>
          <button
            onClick={() => setEditando(!editando)}
            className="mt-4 md:mt-0 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            {editando ? "✕ Cancelar" : "✏️ Editar Datos"}
          </button>
        </div>

        {/* Info Principal del Vehículo */}
        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Imagen */}
            <div className="w-full md:w-48 h-32 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
              <span className="text-6xl">🚚</span>
            </div>

            {/* Datos */}
            <div className="flex-1">
              {editando ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Marca
                      </label>
                      <input
                        type="text"
                        value={datosVehiculo.marca}
                        onChange={(e) =>
                          setDatosVehiculo({
                            ...datosVehiculo,
                            marca: e.target.value,
                          })
                        }
                        className="input-field w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Modelo
                      </label>
                      <input
                        type="text"
                        value={datosVehiculo.modelo}
                        onChange={(e) =>
                          setDatosVehiculo({
                            ...datosVehiculo,
                            modelo: e.target.value,
                          })
                        }
                        className="input-field w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Patente
                      </label>
                      <input
                        type="text"
                        value={datosVehiculo.patente}
                        onChange={(e) =>
                          setDatosVehiculo({
                            ...datosVehiculo,
                            patente: e.target.value,
                          })
                        }
                        className="input-field w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Año
                      </label>
                      <input
                        type="number"
                        value={datosVehiculo.año}
                        onChange={(e) =>
                          setDatosVehiculo({
                            ...datosVehiculo,
                            año: parseInt(e.target.value),
                          })
                        }
                        className="input-field w-full"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleGuardar}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    💾 Guardar Cambios
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {vehiculo.marca} {vehiculo.modelo}
                  </h2>
                  <p className="text-lg text-gray-600">{vehiculo.año}</p>
                  <div className="flex flex-wrap gap-4 mt-3">
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium">
                      🔢 {vehiculo.patente}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium">
                      ⛽ {vehiculo.tipoCombustible}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium">
                      📦 {vehiculo.capacidad}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        vehiculo.estado === "operativo"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {vehiculo.estado === "operativo"
                        ? "✅ Operativo"
                        : "🔧 En mantenimiento"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats del Vehículo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-700">Kilometraje</h3>
              <button
                onClick={registrarKm}
                className="text-orange-600 hover:underline text-sm"
              >
                Actualizar
              </button>
            </div>
            <p className="text-3xl font-bold text-gray-800">
              {formatNumber(vehiculo.kmActual)}{" "}
              <span className="text-lg">km</span>
            </p>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-2">
              Próximo Service
            </h3>
            <p className="text-3xl font-bold text-gray-800">
              {formatNumber(vehiculo.proximoService)}{" "}
              <span className="text-lg">km</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Faltan {formatNumber(kmRestantes)} km
            </p>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-700 mb-2">VTV</h3>
            <p className="text-lg font-bold text-gray-800">
              {formatDate(vehiculo.vencimientoVTV)}
            </p>
            <span className="text-sm text-green-600">✅ Vigente</span>
          </div>
        </div>

        {/* Indicador de Service */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Estado del Service</h3>
            <span
              className={`text-sm font-medium ${
                porcentajeService < 50
                  ? "text-green-600"
                  : porcentajeService < 80
                    ? "text-yellow-600"
                    : "text-red-600"
              }`}
            >
              {porcentajeService < 50
                ? "En buen estado"
                : porcentajeService < 80
                  ? "Service próximo"
                  : "¡Service urgente!"}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all duration-500 ${
                porcentajeService < 50
                  ? "bg-green-500"
                  : porcentajeService < 80
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
              style={{ width: `${porcentajeService}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>Último service</span>
            <span>{formatNumber(kmRestantes)} km restantes</span>
            <span>Próximo service</span>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={registrarKm}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-center"
            >
              <span className="text-3xl block mb-2">🔢</span>
              <span className="text-sm font-medium">Registrar KM</span>
            </button>
            <button
              onClick={registrarCargaCombustible}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-center"
            >
              <span className="text-3xl block mb-2">⛽</span>
              <span className="text-sm font-medium">Cargar Combustible</span>
            </button>
            <button
              onClick={programarMantenimiento}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-center"
            >
              <span className="text-3xl block mb-2">🔧</span>
              <span className="text-sm font-medium">Programar Service</span>
            </button>
            <button
              onClick={() => {
                Swal.fire({
                  title: "Reportar Problema",
                  input: "textarea",
                  inputPlaceholder: "Describe el problema del vehículo...",
                  showCancelButton: true,
                  confirmButtonText: "Reportar",
                  confirmButtonColor: "#f97316",
                }).then((result) => {
                  if (result.isConfirmed && result.value) {
                    Swal.fire({
                      icon: "success",
                      title: "Problema reportado",
                      text: "Se ha notificado el problema",
                      timer: 2000,
                      showConfirmButton: false,
                    });
                  }
                });
              }}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-center"
            >
              <span className="text-3xl block mb-2">⚠️</span>
              <span className="text-sm font-medium">Reportar Problema</span>
            </button>
          </div>
        </div>

        {/* Historial de Mantenimiento */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">
            Historial de Mantenimiento
          </h3>
          <div className="space-y-4">
            {[
              {
                fecha: "2025-01-15",
                tipo: "Service completo",
                km: 40000,
                costo: 45000,
              },
              {
                fecha: "2024-11-20",
                tipo: "Cambio de aceite",
                km: 35000,
                costo: 15000,
              },
              {
                fecha: "2024-09-10",
                tipo: "Cambio de neumáticos",
                km: 32000,
                costo: 80000,
              },
              {
                fecha: "2024-07-05",
                tipo: "Service completo",
                km: 30000,
                costo: 42000,
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <span>🔧</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{item.tipo}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(item.fecha)} • {formatNumber(item.km)} km
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-red-600">
                  ${formatNumber(item.costo)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Documentación */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">
            📄 Documentación del Vehículo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">VTV</p>
                  <p className="text-sm text-gray-500">
                    Vence: {formatDate(vehiculo.vencimientoVTV)}
                  </p>
                </div>
                <span className="text-green-500 text-2xl">✅</span>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">Seguro</p>
                  <p className="text-sm text-gray-500">
                    Vence: {formatDate(vehiculo.vencimientoSeguro)}
                  </p>
                </div>
                <span className="text-green-500 text-2xl">✅</span>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">Habilitación</p>
                  <p className="text-sm text-gray-500">
                    Habilitado para transporte
                  </p>
                </div>
                <span className="text-green-500 text-2xl">✅</span>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">Patente</p>
                  <p className="text-sm text-gray-500">{vehiculo.patente}</p>
                </div>
                <span className="text-green-500 text-2xl">✅</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FleteLayout>
  );
}
