import api from "./api";

// Obtener todos los pedidos
export const getPedidos = async () => {
  const response = await api.get("/pedidos");
  return response.data;
};

// Obtener un pedido por ID
export const getPedidoById = async (id) => {
  const response = await api.get(`/pedidos/${id}`);
  return response.data;
};

// Crear un nuevo pedido
export const createPedido = async (pedidoData) => {
  const response = await api.post("/pedidos", pedidoData);
  return response.data;
};

// Actualizar un pedido
export const updatePedido = async (id, pedidoData) => {
  const response = await api.put(`/pedidos/${id}`, pedidoData);
  return response.data;
};

// Eliminar un pedido
export const deletePedido = async (id) => {
  const response = await api.delete(`/pedidos/${id}`);
  return response.data;
};

// Actualizar estado del pedido
export const updatePedidoStatus = async (id, status) => {
  const response = await api.patch(`/pedidos/${id}/status`, { status });
  return response.data;
};
