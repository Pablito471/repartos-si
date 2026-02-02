import api from "./api";

// Obtener todos los repartos
export const getRepartos = async () => {
  const response = await api.get("/repartos");
  return response.data;
};

// Obtener un reparto por ID
export const getRepartoById = async (id) => {
  const response = await api.get(`/repartos/${id}`);
  return response.data;
};

// Crear un nuevo reparto
export const createReparto = async (repartoData) => {
  const response = await api.post("/repartos", repartoData);
  return response.data;
};

// Actualizar un reparto
export const updateReparto = async (id, repartoData) => {
  const response = await api.put(`/repartos/${id}`, repartoData);
  return response.data;
};

// Eliminar un reparto
export const deleteReparto = async (id) => {
  const response = await api.delete(`/repartos/${id}`);
  return response.data;
};

// Asignar pedidos a un reparto
export const assignPedidosToReparto = async (repartoId, pedidoIds) => {
  const response = await api.post(`/repartos/${repartoId}/pedidos`, {
    pedidoIds,
  });
  return response.data;
};

// Obtener repartos por fecha
export const getRepartosByDate = async (date) => {
  const response = await api.get(`/repartos/fecha/${date}`);
  return response.data;
};
