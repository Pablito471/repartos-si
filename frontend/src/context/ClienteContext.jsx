import { createContext, useContext, useState, useEffect } from "react";
import {
  usuariosService,
  productosService,
  pedidosService,
  movimientosService,
} from "../services/api";
import { useAuth } from "./AuthContext";

const ClienteContext = createContext();

// Configurar modo de conexión: 'api' o 'local'
const MODO_CONEXION = process.env.NEXT_PUBLIC_MODE || "api";

// Datos de ejemplo para demostración
const pedidosIniciales = [
  {
    id: 1,
    fecha: "2026-02-01",
    productos: [
      { nombre: "Producto A", cantidad: 10, precio: 150 },
      { nombre: "Producto B", cantidad: 5, precio: 200 },
    ],
    deposito: "Depósito Central",
    tipoEnvio: "flete",
    estado: "pendiente",
    total: 2500,
    direccion: "Calle Principal 123",
  },
  {
    id: 2,
    fecha: "2026-01-28",
    productos: [{ nombre: "Producto C", cantidad: 20, precio: 80 }],
    deposito: "Depósito Norte",
    tipoEnvio: "envio",
    estado: "entregado",
    total: 1600,
    direccion: "Av. Libertad 456",
  },
  {
    id: 3,
    fecha: "2026-01-25",
    productos: [
      { nombre: "Producto A", cantidad: 15, precio: 150 },
      { nombre: "Producto D", cantidad: 8, precio: 300 },
    ],
    deposito: "Depósito Sur",
    tipoEnvio: "retiro",
    estado: "en_camino",
    total: 4650,
    direccion: "Pasaje Los Robles 789",
  },
];

const depositosIniciales = [
  {
    id: 1,
    nombre: "Depósito Central",
    direccion: "Av. Industrial 1000",
    telefono: "555-0100",
    horarioApertura: "08:00",
    horarioCierre: "18:00",
    diasLaborales: [1, 2, 3, 4, 5], // Lunes a Viernes
    disponible: true,
    tiposEnvio: ["envio", "flete", "retiro"],
    imagen: "🏭",
    productos: [
      {
        id: 1,
        codigo: "PROD-001",
        nombre: "Producto A",
        categoria: "Categoría 1",
        precio: 150,
        stock: 100,
        imagen:
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200",
      },
      {
        id: 2,
        codigo: "PROD-002",
        nombre: "Producto B",
        categoria: "Categoría 1",
        precio: 200,
        stock: 50,
        imagen:
          "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200",
      },
      {
        id: 3,
        codigo: "PROD-003",
        nombre: "Producto C",
        categoria: "Categoría 2",
        precio: 80,
        stock: 200,
        imagen:
          "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=200",
      },
      {
        id: 4,
        codigo: "PROD-004",
        nombre: "Producto D",
        categoria: "Categoría 2",
        precio: 300,
        stock: 15,
        imagen:
          "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200",
      },
      {
        id: 5,
        codigo: "PROD-005",
        nombre: "Producto E",
        categoria: "Categoría 3",
        precio: 450,
        stock: 30,
        imagen:
          "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=200",
      },
      {
        id: 6,
        codigo: "PROD-006",
        nombre: "Producto F",
        categoria: "Categoría 3",
        precio: 120,
        stock: 150,
        imagen: "",
      },
    ],
  },
  {
    id: 2,
    nombre: "Depósito Norte",
    direccion: "Ruta 5 Km 12",
    telefono: "555-0200",
    horarioApertura: "07:00",
    horarioCierre: "17:00",
    diasLaborales: [1, 2, 3, 4, 5, 6], // Lunes a Sábado
    disponible: true,
    tiposEnvio: ["envio", "flete"],
    imagen: "🏢",
    productos: [
      {
        id: 7,
        codigo: "PROD-007",
        nombre: "Producto G",
        categoria: "Categoría 1",
        precio: 180,
        stock: 80,
        imagen:
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200",
      },
      {
        id: 8,
        codigo: "PROD-008",
        nombre: "Producto H",
        categoria: "Categoría 2",
        precio: 250,
        stock: 45,
        imagen:
          "https://images.unsplash.com/photo-1491553895911-0055uj47a85?w=200",
      },
      {
        id: 9,
        codigo: "PROD-009",
        nombre: "Producto I",
        categoria: "Categoría 3",
        precio: 90,
        stock: 120,
        imagen: "",
      },
      {
        id: 10,
        codigo: "PROD-010",
        nombre: "Producto J",
        categoria: "Categoría 1",
        precio: 350,
        stock: 25,
        imagen:
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200",
      },
    ],
  },
  {
    id: 3,
    nombre: "Depósito Sur",
    direccion: "Parque Logístico Sur",
    telefono: "555-0300",
    horarioApertura: "09:00",
    horarioCierre: "19:00",
    diasLaborales: [1, 2, 3, 4, 5], // Lunes a Viernes
    disponible: true,
    tiposEnvio: ["envio", "retiro"],
    imagen: "🏗️",
    productos: [
      {
        id: 11,
        codigo: "PROD-011",
        nombre: "Producto K",
        categoria: "Categoría 1",
        precio: 220,
        stock: 60,
        imagen:
          "https://images.unsplash.com/photo-1503602642458-232111445657?w=200",
      },
      {
        id: 12,
        codigo: "PROD-012",
        nombre: "Producto L",
        categoria: "Categoría 2",
        precio: 175,
        stock: 90,
        imagen: "",
      },
      {
        id: 13,
        codigo: "PROD-013",
        nombre: "Producto M",
        categoria: "Categoría 3",
        precio: 400,
        stock: 20,
        imagen:
          "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=200",
      },
      {
        id: 14,
        codigo: "PROD-014",
        nombre: "Producto N",
        categoria: "Categoría 1",
        precio: 130,
        stock: 110,
        imagen:
          "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=200",
      },
      {
        id: 15,
        codigo: "PROD-015",
        nombre: "Producto O",
        categoria: "Categoría 2",
        precio: 280,
        stock: 35,
        imagen: "",
      },
    ],
  },
  {
    id: 4,
    nombre: "Depósito Este",
    direccion: "Zona Franca Este",
    telefono: "555-0400",
    horario: "Lun-Vie 8:00 - 16:00",
    disponible: false,
    tiposEnvio: ["flete"],
    imagen: "🏚️",
    productos: [],
  },
];

const movimientosIniciales = [
  {
    id: 1,
    fecha: "2026-02-01",
    tipo: "ingreso",
    concepto: "Venta de productos",
    monto: 5000,
    categoria: "ventas",
  },
  {
    id: 2,
    fecha: "2026-02-01",
    tipo: "egreso",
    concepto: "Pago de flete",
    monto: 350,
    categoria: "logistica",
  },
  {
    id: 3,
    fecha: "2026-01-31",
    tipo: "ingreso",
    concepto: "Venta de productos",
    monto: 3200,
    categoria: "ventas",
  },
  {
    id: 4,
    fecha: "2026-01-31",
    tipo: "egreso",
    concepto: "Compra de mercadería",
    monto: 2000,
    categoria: "compras",
  },
  {
    id: 5,
    fecha: "2026-01-30",
    tipo: "ingreso",
    concepto: "Cobro a cliente",
    monto: 1500,
    categoria: "cobranzas",
  },
  {
    id: 6,
    fecha: "2026-01-30",
    tipo: "egreso",
    concepto: "Pago de servicios",
    monto: 800,
    categoria: "servicios",
  },
  {
    id: 7,
    fecha: "2026-01-29",
    tipo: "ingreso",
    concepto: "Venta de productos",
    monto: 4500,
    categoria: "ventas",
  },
  {
    id: 8,
    fecha: "2026-01-28",
    tipo: "egreso",
    concepto: "Compra de insumos",
    monto: 1200,
    categoria: "compras",
  },
];

const productosDisponibles = [
  {
    id: 1,
    nombre: "Producto A",
    precio: 150,
    stock: 100,
    categoria: "Categoría 1",
  },
  {
    id: 2,
    nombre: "Producto B",
    precio: 200,
    stock: 50,
    categoria: "Categoría 1",
  },
  {
    id: 3,
    nombre: "Producto C",
    precio: 80,
    stock: 200,
    categoria: "Categoría 2",
  },
  {
    id: 4,
    nombre: "Producto D",
    precio: 300,
    stock: 75,
    categoria: "Categoría 2",
  },
  {
    id: 5,
    nombre: "Producto E",
    precio: 450,
    stock: 30,
    categoria: "Categoría 3",
  },
  {
    id: 6,
    nombre: "Producto F",
    precio: 120,
    stock: 150,
    categoria: "Categoría 3",
  },
];

export function ClienteProvider({ children }) {
  const { usuario } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [depositos, setDepositos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [totalesContables, setTotalesContables] = useState({
    ingresos: 0,
    egresos: 0,
    balance: 0,
    categorias: {},
    porMes: {},
  });
  const [productos] = useState(productosDisponibles);
  const [cargandoDepositos, setCargandoDepositos] = useState(true);
  const [cargandoPedidos, setCargandoPedidos] = useState(true);
  const [cargandoMovimientos, setCargandoMovimientos] = useState(false);
  const [carrito, setCarrito] = useState({
    productos: [], // Cada producto incluye depositoId
  });

  // Función para validar UUID
  const isValidUUID = (str) => {
    if (!str || typeof str !== "string") return false;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Cargar depósitos desde el backend
  useEffect(() => {
    const cargarDepositos = async () => {
      setCargandoDepositos(true);
      if (MODO_CONEXION === "api") {
        try {
          const response = await usuariosService.getDepositos();
          const depositosBackend = response.data || response || [];

          // Cargar productos para cada depósito
          const depositosConProductos = await Promise.all(
            depositosBackend.map(async (dep) => {
              try {
                const prodResponse = await productosService.getByDeposito(
                  dep.id,
                );
                const productos = prodResponse.data || prodResponse || [];
                return {
                  id: dep.id,
                  nombre: dep.nombre,
                  direccion: dep.direccion || "",
                  telefono: dep.telefono || "",
                  horarioApertura:
                    dep.horarioApertura || dep.horario_apertura || "08:00",
                  horarioCierre:
                    dep.horarioCierre || dep.horario_cierre || "18:00",
                  diasLaborales: dep.diasLaborales ||
                    dep.dias_laborales || [1, 2, 3, 4, 5],
                  tiposEnvio: dep.tiposEnvio || dep.tipos_envio || ["envio"],
                  disponible: true,
                  imagen: dep.foto || "🏭",
                  productos: productos.map((p) => ({
                    id: p.id,
                    codigo: p.codigo,
                    nombre: p.nombre,
                    categoria: p.categoria || "Sin categoría",
                    precio: parseFloat(p.precio) || 0,
                    stock: p.stock || 0,
                    imagen: p.imagen || "",
                  })),
                };
              } catch (error) {
                console.error(
                  `Error al cargar productos del depósito ${dep.id}:`,
                  error,
                );
                return {
                  id: dep.id,
                  nombre: dep.nombre,
                  direccion: dep.direccion || "",
                  telefono: dep.telefono || "",
                  horarioApertura:
                    dep.horarioApertura || dep.horario_apertura || "08:00",
                  horarioCierre:
                    dep.horarioCierre || dep.horario_cierre || "18:00",
                  diasLaborales: dep.diasLaborales ||
                    dep.dias_laborales || [1, 2, 3, 4, 5],
                  tiposEnvio: dep.tiposEnvio || dep.tipos_envio || ["envio"],
                  disponible: true,
                  imagen: dep.foto || "🏭",
                  productos: [],
                };
              }
            }),
          );

          setDepositos(depositosConProductos);
        } catch (error) {
          console.error("Error al cargar depósitos:", error);
          setDepositos(depositosIniciales); // Fallback a datos de ejemplo
        }
      } else {
        setDepositos(depositosIniciales);
      }
      setCargandoDepositos(false);
    };

    cargarDepositos();
  }, [usuario?.id]);

  // Cargar pedidos desde el backend
  useEffect(() => {
    const cargarPedidos = async () => {
      if (MODO_CONEXION === "api" && usuario?.id) {
        setCargandoPedidos(true);
        try {
          const response = await pedidosService.getAll();
          const pedidosBackend = response.data || response || [];

          console.log("Pedidos del cliente cargados:", pedidosBackend.length);

          // Mapear pedidos del backend al formato del frontend
          const pedidosMapeados = pedidosBackend.map((pedido) => ({
            id: pedido.id,
            fecha: pedido.createdAt
              ? pedido.createdAt.split("T")[0]
              : pedido.fecha,
            productos:
              pedido.productos?.map((p) => ({
                nombre: p.nombre || p.producto?.nombre,
                cantidad: p.cantidad,
                precio: parseFloat(p.precioUnitario || p.precio) || 0,
              })) || [],
            deposito: pedido.deposito?.nombre || "Sin depósito",
            depositoId: pedido.depositoId,
            tipoEnvio: pedido.tipoEnvio || "envio",
            estado: pedido.estado || "pendiente",
            total: parseFloat(pedido.total) || 0,
            direccion: pedido.direccionEntrega || pedido.direccion || "",
            notas: pedido.notas || "",
            prioridad: pedido.prioridad || "normal",
          }));

          setPedidos(pedidosMapeados);
        } catch (error) {
          console.error("Error al cargar pedidos:", error);
          setPedidos([]); // Sin pedidos si hay error
        } finally {
          setCargandoPedidos(false);
        }
      } else if (!usuario?.id) {
        setPedidos([]);
        setCargandoPedidos(false);
      } else {
        setPedidos(pedidosIniciales);
        setCargandoPedidos(false);
      }
    };

    cargarPedidos();
  }, [usuario?.id]);

  // Escuchar eventos del navegador desde NotificacionContext (socket centralizado)
  useEffect(() => {
    if (MODO_CONEXION !== "api" || !usuario?.id) return;

    const handlePedidoActualizado = (event) => {
      const data = event.detail;
      console.log("ClienteContext: Recibido socket:pedido_actualizado", data);
      setPedidos((prevPedidos) =>
        prevPedidos.map((p) =>
          String(p.id) === String(data.id) ? { ...p, estado: data.estado } : p,
        ),
      );
    };

    const handleEnvioEnCamino = (event) => {
      const data = event.detail;
      console.log("ClienteContext: Recibido socket:envio_en_camino", data);
      setPedidos((prevPedidos) =>
        prevPedidos.map((p) =>
          String(p.id) === String(data.pedidoId)
            ? { ...p, estado: "enviado" }
            : p,
        ),
      );
    };

    const handleEnvioEntregado = (event) => {
      const data = event.detail;
      console.log("ClienteContext: Recibido socket:envio_entregado", data);
      setPedidos((prevPedidos) =>
        prevPedidos.map((p) =>
          String(p.id) === String(data.pedidoId)
            ? { ...p, estado: "entregado" }
            : p,
        ),
      );
    };

    window.addEventListener(
      "socket:pedido_actualizado",
      handlePedidoActualizado,
    );
    window.addEventListener("socket:envio_en_camino", handleEnvioEnCamino);
    window.addEventListener("socket:envio_entregado", handleEnvioEntregado);

    return () => {
      window.removeEventListener(
        "socket:pedido_actualizado",
        handlePedidoActualizado,
      );
      window.removeEventListener("socket:envio_en_camino", handleEnvioEnCamino);
      window.removeEventListener(
        "socket:envio_entregado",
        handleEnvioEntregado,
      );
    };
  }, [usuario?.id]);

  // Cargar movimientos contables desde el backend
  useEffect(() => {
    const cargarMovimientos = async () => {
      if (MODO_CONEXION !== "api" || !usuario?.id) return;

      setCargandoMovimientos(true);
      try {
        const [movimientosRes, totalesRes] = await Promise.all([
          movimientosService.listar(),
          movimientosService.getTotales(),
        ]);

        const movimientosData = movimientosRes.data || movimientosRes || [];
        setMovimientos(
          movimientosData.map((m) => ({
            id: m.id,
            fecha:
              m.createdAt?.split("T")[0] ||
              new Date().toISOString().split("T")[0],
            tipo: m.tipo,
            concepto: m.concepto,
            monto: parseFloat(m.monto),
            categoria: m.categoria,
            pedidoId: m.pedidoId,
            notas: m.notas,
          })),
        );

        const totalesData = totalesRes.data || totalesRes || {};
        setTotalesContables({
          ingresos: totalesData.ingresos || 0,
          egresos: totalesData.egresos || 0,
          balance: totalesData.balance || 0,
          categorias: totalesData.categorias || {},
          porMes: totalesData.porMes || {},
        });
      } catch (error) {
        console.error("Error al cargar movimientos:", error);
        setMovimientos([]);
      } finally {
        setCargandoMovimientos(false);
      }
    };

    cargarMovimientos();
  }, [usuario?.id]);

  // Funciones del carrito
  const agregarAlCarrito = (producto, depositoId) => {
    // Buscar si ya existe el producto del mismo depósito
    const existe = carrito.productos.find(
      (p) =>
        String(p.id) === String(producto.id) &&
        String(p.depositoId) === String(depositoId),
    );
    if (existe) {
      setCarrito({
        productos: carrito.productos.map((p) =>
          String(p.id) === String(producto.id) &&
          String(p.depositoId) === String(depositoId)
            ? { ...p, cantidad: p.cantidad + 1 }
            : p,
        ),
      });
    } else {
      setCarrito({
        productos: [
          ...carrito.productos,
          { ...producto, depositoId, cantidad: 1 },
        ],
      });
    }
    return true;
  };

  const actualizarCantidadCarrito = (productoId, depositoId, cantidad) => {
    if (cantidad < 1) {
      eliminarDelCarrito(productoId, depositoId);
    } else {
      setCarrito({
        productos: carrito.productos.map((p) =>
          String(p.id) === String(productoId) &&
          String(p.depositoId) === String(depositoId)
            ? { ...p, cantidad }
            : p,
        ),
      });
    }
  };

  const eliminarDelCarrito = (productoId, depositoId) => {
    const nuevosProductos = carrito.productos.filter(
      (p) =>
        !(
          String(p.id) === String(productoId) &&
          String(p.depositoId) === String(depositoId)
        ),
    );
    setCarrito({
      productos: nuevosProductos,
    });
  };

  const vaciarCarrito = () => {
    setCarrito({
      productos: [],
    });
  };

  // Obtener depósitos únicos en el carrito
  const getDepositosEnCarrito = () => {
    const depositoIds = [
      ...new Set(carrito.productos.map((p) => p.depositoId)),
    ];
    return depositoIds
      .map((id) => depositos.find((d) => String(d.id) === String(id)))
      .filter(Boolean);
  };

  // Obtener productos del carrito por depósito
  const getProductosPorDeposito = (depositoId) => {
    return carrito.productos.filter(
      (p) => String(p.depositoId) === String(depositoId),
    );
  };

  const getTotalCarrito = () => {
    return carrito.productos.reduce((sum, p) => sum + p.precio * p.cantidad, 0);
  };

  const getCantidadCarrito = () => {
    return carrito.productos.reduce((sum, p) => sum + p.cantidad, 0);
  };

  // Crear pedido
  const crearPedido = async (nuevoPedido) => {
    if (MODO_CONEXION === "api") {
      try {
        // Preparar datos para el backend
        const pedidoBackend = {
          depositoId: nuevoPedido.depositoId,
          tipoEnvio: nuevoPedido.tipoEnvio,
          direccion: nuevoPedido.direccion,
          notas: nuevoPedido.notas || "",
          productos: nuevoPedido.productos.map((p) => ({
            productoId: p.id,
            nombre: p.nombre,
            cantidad: p.cantidad,
            precio: p.precio,
          })),
        };

        console.log("Enviando pedido al backend:", pedidoBackend);

        const response = await pedidosService.crear(pedidoBackend);
        const pedidoCreado = response.data || response;

        console.log("Pedido creado:", pedidoCreado);

        // Agregar al estado local
        const pedidoMapeado = {
          id: pedidoCreado.id,
          fecha: pedidoCreado.createdAt
            ? pedidoCreado.createdAt.split("T")[0]
            : new Date().toISOString().split("T")[0],
          productos: nuevoPedido.productos,
          deposito: nuevoPedido.deposito,
          depositoId: nuevoPedido.depositoId,
          tipoEnvio: nuevoPedido.tipoEnvio,
          estado: pedidoCreado.estado || "pendiente",
          total: parseFloat(pedidoCreado.total) || nuevoPedido.total,
          direccion: nuevoPedido.direccion,
          notas: nuevoPedido.notas,
        };

        setPedidos((prev) => [pedidoMapeado, ...prev]);
        return pedidoMapeado;
      } catch (error) {
        console.error("Error al crear pedido:", error);
        throw error;
      }
    } else {
      // Modo local (fallback)
      const pedido = {
        ...nuevoPedido,
        id: pedidos.length + 1,
        fecha: new Date().toISOString().split("T")[0],
        estado: "pendiente",
      };
      setPedidos([pedido, ...pedidos]);
      return pedido;
    }
  };

  // Modificar pedido
  const modificarPedido = async (id, datosActualizados) => {
    if (MODO_CONEXION === "api") {
      // Verificar que el ID sea un UUID válido antes de llamar al API
      if (!isValidUUID(String(id))) {
        console.warn("ID de pedido inválido (no es UUID):", id);
        setPedidos(
          pedidos.map((p) =>
            String(p.id) === String(id) ? { ...p, ...datosActualizados } : p,
          ),
        );
        return { success: true };
      }

      try {
        // Preparar datos para el backend
        const datosBackend = {
          tipoEnvio: datosActualizados.tipoEnvio,
          direccionEntrega: datosActualizados.direccion,
          notas: datosActualizados.notas || "",
          prioridad: datosActualizados.prioridad || "normal",
        };

        // Si hay productos, incluirlos
        if (datosActualizados.productos) {
          datosBackend.productos = datosActualizados.productos.map((p) => ({
            productoId: p.productoId || p.id || null, // Solo UUID válido o null
            nombre: p.nombre,
            cantidad: p.cantidad,
            precio: p.precio,
          }));
        }

        await pedidosService.actualizar(id, datosBackend);

        // Actualizar estado local
        setPedidos(
          pedidos.map((p) =>
            String(p.id) === String(id) ? { ...p, ...datosActualizados } : p,
          ),
        );
        return { success: true };
      } catch (error) {
        console.error("Error al modificar pedido:", error);
        return { success: false, error: error.message };
      }
    } else {
      setPedidos(
        pedidos.map((p) =>
          String(p.id) === String(id) ? { ...p, ...datosActualizados } : p,
        ),
      );
      return { success: true };
    }
  };

  // Cancelar pedido
  const cancelarPedido = async (id) => {
    if (MODO_CONEXION === "api") {
      // Verificar que el ID sea un UUID válido antes de llamar al API
      if (!isValidUUID(String(id))) {
        console.warn("ID de pedido inválido (no es UUID):", id);
        setPedidos(
          pedidos.map((p) =>
            String(p.id) === String(id) ? { ...p, estado: "cancelado" } : p,
          ),
        );
        return { success: true };
      }

      try {
        await pedidosService.cambiarEstado(id, "cancelado");
        setPedidos(
          pedidos.map((p) =>
            String(p.id) === String(id) ? { ...p, estado: "cancelado" } : p,
          ),
        );
        return { success: true };
      } catch (error) {
        console.error("Error al cancelar pedido:", error);
        return { success: false, error: error.message };
      }
    } else {
      setPedidos(
        pedidos.map((p) =>
          String(p.id) === String(id) ? { ...p, estado: "cancelado" } : p,
        ),
      );
      return { success: true };
    }
  };

  // Agregar movimiento contable
  const agregarMovimiento = async (movimiento) => {
    if (MODO_CONEXION === "api") {
      try {
        const response = await movimientosService.crear({
          tipo: movimiento.tipo,
          concepto: movimiento.concepto,
          monto: parseFloat(movimiento.monto),
          categoria: movimiento.categoria || "otros",
          notas: movimiento.notas || null,
        });

        const nuevoMovimiento = response.data || response;
        const movimientoFormateado = {
          id: nuevoMovimiento.id,
          fecha:
            nuevoMovimiento.createdAt?.split("T")[0] ||
            new Date().toISOString().split("T")[0],
          tipo: nuevoMovimiento.tipo,
          concepto: nuevoMovimiento.concepto,
          monto: parseFloat(nuevoMovimiento.monto),
          categoria: nuevoMovimiento.categoria,
        };

        setMovimientos((prev) => [movimientoFormateado, ...prev]);

        // Actualizar totales
        setTotalesContables((prev) => ({
          ...prev,
          ingresos:
            movimiento.tipo === "ingreso"
              ? prev.ingresos + parseFloat(movimiento.monto)
              : prev.ingresos,
          egresos:
            movimiento.tipo === "egreso"
              ? prev.egresos + parseFloat(movimiento.monto)
              : prev.egresos,
          balance:
            movimiento.tipo === "ingreso"
              ? prev.balance + parseFloat(movimiento.monto)
              : prev.balance - parseFloat(movimiento.monto),
        }));

        return { success: true, data: movimientoFormateado };
      } catch (error) {
        console.error("Error al crear movimiento:", error);
        return { success: false, error: error.message };
      }
    } else {
      const nuevoMovimiento = {
        ...movimiento,
        id: movimientos.length + 1,
        fecha: new Date().toISOString().split("T")[0],
      };
      setMovimientos([nuevoMovimiento, ...movimientos]);
      return { success: true, data: nuevoMovimiento };
    }
  };

  // Eliminar movimiento contable
  const eliminarMovimiento = async (id) => {
    if (MODO_CONEXION === "api") {
      try {
        await movimientosService.eliminar(id);
        const movimientoEliminado = movimientos.find((m) => m.id === id);

        setMovimientos((prev) => prev.filter((m) => m.id !== id));

        // Actualizar totales
        if (movimientoEliminado) {
          setTotalesContables((prev) => ({
            ...prev,
            ingresos:
              movimientoEliminado.tipo === "ingreso"
                ? prev.ingresos - movimientoEliminado.monto
                : prev.ingresos,
            egresos:
              movimientoEliminado.tipo === "egreso"
                ? prev.egresos - movimientoEliminado.monto
                : prev.egresos,
            balance:
              movimientoEliminado.tipo === "ingreso"
                ? prev.balance - movimientoEliminado.monto
                : prev.balance + movimientoEliminado.monto,
          }));
        }

        return { success: true };
      } catch (error) {
        console.error("Error al eliminar movimiento:", error);
        return { success: false, error: error.message };
      }
    } else {
      setMovimientos((prev) => prev.filter((m) => m.id !== id));
      return { success: true };
    }
  };

  // Actualizar movimiento contable
  const actualizarMovimiento = async (id, datos) => {
    if (MODO_CONEXION === "api") {
      try {
        const response = await movimientosService.actualizar(id, datos);
        const movimientoActualizado = response.data || response;

        setMovimientos((prev) =>
          prev.map((m) =>
            m.id === id
              ? {
                  ...m,
                  tipo: movimientoActualizado.tipo,
                  concepto: movimientoActualizado.concepto,
                  monto: parseFloat(movimientoActualizado.monto),
                  categoria: movimientoActualizado.categoria,
                }
              : m,
          ),
        );

        // Recargar totales para mantener consistencia
        const totalesRes = await movimientosService.getTotales();
        const totalesData = totalesRes.data || totalesRes || {};
        setTotalesContables({
          ingresos: totalesData.ingresos || 0,
          egresos: totalesData.egresos || 0,
          balance: totalesData.balance || 0,
          categorias: totalesData.categorias || {},
          porMes: totalesData.porMes || {},
        });

        return { success: true, data: movimientoActualizado };
      } catch (error) {
        console.error("Error al actualizar movimiento:", error);
        return { success: false, error: error.message };
      }
    } else {
      setMovimientos((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...datos } : m)),
      );
      return { success: true };
    }
  };

  // Recargar movimientos desde el backend
  const recargarMovimientos = async () => {
    if (MODO_CONEXION !== "api") return;

    setCargandoMovimientos(true);
    try {
      const [movimientosRes, totalesRes] = await Promise.all([
        movimientosService.listar(),
        movimientosService.getTotales(),
      ]);

      const movimientosData = movimientosRes.data || movimientosRes || [];
      setMovimientos(
        movimientosData.map((m) => ({
          id: m.id,
          fecha:
            m.createdAt?.split("T")[0] ||
            new Date().toISOString().split("T")[0],
          tipo: m.tipo,
          concepto: m.concepto,
          monto: parseFloat(m.monto),
          categoria: m.categoria,
          pedidoId: m.pedidoId,
          notas: m.notas,
        })),
      );

      const totalesData = totalesRes.data || totalesRes || {};
      setTotalesContables({
        ingresos: totalesData.ingresos || 0,
        egresos: totalesData.egresos || 0,
        balance: totalesData.balance || 0,
        categorias: totalesData.categorias || {},
        porMes: totalesData.porMes || {},
      });
    } catch (error) {
      console.error("Error al recargar movimientos:", error);
    } finally {
      setCargandoMovimientos(false);
    }
  };

  // Calcular totales de contabilidad
  const calcularTotales = () => {
    // Si tenemos totales del backend, usarlos
    if (
      (MODO_CONEXION === "api" && totalesContables.ingresos > 0) ||
      totalesContables.egresos > 0
    ) {
      return totalesContables;
    }

    // Calcular desde los movimientos locales
    const ingresos = movimientos
      .filter((m) => m.tipo === "ingreso")
      .reduce((sum, m) => sum + m.monto, 0);
    const egresos = movimientos
      .filter((m) => m.tipo === "egreso")
      .reduce((sum, m) => sum + m.monto, 0);
    return {
      ingresos,
      egresos,
      balance: ingresos - egresos,
      categorias: totalesContables.categorias || {},
      porMes: totalesContables.porMes || {},
    };
  };

  // Estadísticas del dashboard
  const getEstadisticas = () => {
    const pedidosPendientes = pedidos.filter(
      (p) => p.estado === "pendiente",
    ).length;
    const pedidosEnCamino = pedidos.filter(
      (p) => p.estado === "en_camino",
    ).length;
    const pedidosEntregados = pedidos.filter(
      (p) => p.estado === "entregado",
    ).length;
    const totalPedidos = pedidos.filter((p) => p.estado !== "cancelado").length;
    const totales = calcularTotales();

    return {
      pedidosPendientes,
      pedidosEnCamino,
      pedidosEntregados,
      totalPedidos,
      ...totales,
    };
  };

  const value = {
    pedidos,
    depositos,
    movimientos,
    totalesContables,
    productos,
    carrito,
    agregarAlCarrito,
    actualizarCantidadCarrito,
    eliminarDelCarrito,
    vaciarCarrito,
    getTotalCarrito,
    getCantidadCarrito,
    getDepositosEnCarrito,
    getProductosPorDeposito,
    crearPedido,
    modificarPedido,
    cancelarPedido,
    agregarMovimiento,
    eliminarMovimiento,
    actualizarMovimiento,
    recargarMovimientos,
    calcularTotales,
    getEstadisticas,
    cargandoDepositos,
    cargandoPedidos,
    cargandoMovimientos,
  };

  return (
    <ClienteContext.Provider value={value}>{children}</ClienteContext.Provider>
  );
}

export function useCliente() {
  const context = useContext(ClienteContext);
  if (!context) {
    throw new Error("useCliente debe usarse dentro de un ClienteProvider");
  }
  return context;
}
