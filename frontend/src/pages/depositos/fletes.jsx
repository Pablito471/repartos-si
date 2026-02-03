import DepositoLayout from "@/components/layouts/DepositoLayout";
import { useDeposito } from "@/context/DepositoContext";
import { useState, useEffect } from "react";
import { relacionesService } from "@/services/api";
import {
  showSuccessAlert,
  showConfirmAlert,
  showErrorAlert,
} from "@/utils/alerts";

export default function FletesVinculados() {
  const { fletes, cargarFletes } = useDeposito();
  const [fletesDisponibles, setFletesDisponibles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoDisponibles, setCargandoDisponibles] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      if (cargarFletes) {
        await cargarFletes();
      }
    } catch (error) {
      console.error("Error al cargar fletes:", error);
    } finally {
      setCargando(false);
    }
  };

  const cargarFletesDisponibles = async () => {
    setCargandoDisponibles(true);
    try {
      const response = await relacionesService.getFletesDisponibles();
      setFletesDisponibles(response.data || []);
    } catch (error) {
      console.error("Error al cargar fletes disponibles:", error);
      setFletesDisponibles([]);
    } finally {
      setCargandoDisponibles(false);
    }
  };

  const handleAbrirModal = () => {
    setMostrarModal(true);
    cargarFletesDisponibles();
  };

  const handleVincularFlete = async (fleteId) => {
    try {
      await relacionesService.vincularFlete(fleteId);
      await showSuccessAlert("¡Éxito!", "Flete vinculado correctamente");
      setMostrarModal(false);
      cargarDatos();
    } catch (error) {
      console.error("Error al vincular flete:", error);
      showErrorAlert("Error", "No se pudo vincular el flete");
    }
  };

  const handleDesvincularFlete = async (fleteId, nombre) => {
    const confirmado = await showConfirmAlert(
      "Desvincular flete",
      `¿Estás seguro de desvincular a ${nombre}?`,
    );

    if (confirmado) {
      try {
        await relacionesService.desvincularFlete(fleteId);
        await showSuccessAlert("¡Éxito!", "Flete desvinculado correctamente");
        cargarDatos();
      } catch (error) {
        console.error("Error al desvincular flete:", error);
        showErrorAlert("Error", "No se pudo desvincular el flete");
      }
    }
  };

  if (cargando) {
    return (
      <DepositoLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-600">Cargando fletes...</span>
        </div>
      </DepositoLayout>
    );
  }

  return (
    <DepositoLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Fletes Vinculados
            </h1>
            <p className="text-gray-600">
              Gestiona los transportistas asociados a tu depósito
            </p>
          </div>
          <button
            onClick={handleAbrirModal}
            className="btn btn-primary flex items-center gap-2"
          >
            <span>➕</span>
            Vincular Flete
          </button>
        </div>

        {/* Lista de fletes vinculados */}
        {fletes.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">🚛</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No tienes fletes vinculados
            </h3>
            <p className="text-gray-500 mb-4">
              Vincula transportistas para poder asignarles envíos
            </p>
            <button onClick={handleAbrirModal} className="btn btn-primary">
              Vincular mi primer flete
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {fletes.map((flete) => (
              <div key={flete.id} className="card">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🚛</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">
                      {flete.nombre}
                    </h3>
                    <p className="text-sm text-gray-500">{flete.email}</p>
                    {flete.telefono && (
                      <p className="text-sm text-gray-600 mt-1">
                        📞 {flete.telefono}
                      </p>
                    )}
                    {flete.vehiculoTipo && (
                      <div className="mt-2 text-sm">
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                          🚐 {flete.vehiculoTipo}
                          {flete.vehiculoPatente &&
                            ` - ${flete.vehiculoPatente}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t flex justify-end gap-2">
                  <button
                    onClick={() =>
                      handleDesvincularFlete(flete.id, flete.nombre)
                    }
                    className="btn btn-sm bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    Desvincular
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal para vincular nuevo flete */}
        {mostrarModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">Vincular Flete</h2>
                <button
                  onClick={() => setMostrarModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                {cargandoDisponibles ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  </div>
                ) : fletesDisponibles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">😕</div>
                    <p>No hay fletes disponibles para vincular</p>
                    <p className="text-sm mt-2">
                      Todos los fletes ya están vinculados o no hay fletes
                      registrados
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fletesDisponibles.map((flete) => (
                      <div
                        key={flete.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span>🚛</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {flete.nombre}
                            </p>
                            <p className="text-sm text-gray-500">
                              {flete.email}
                            </p>
                            {flete.vehiculoTipo && (
                              <p className="text-xs text-gray-400">
                                {flete.vehiculoTipo}{" "}
                                {flete.vehiculoPatente &&
                                  `- ${flete.vehiculoPatente}`}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleVincularFlete(flete.id)}
                          className="btn btn-sm btn-primary"
                        >
                          Vincular
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DepositoLayout>
  );
}
