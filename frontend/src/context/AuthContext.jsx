import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  authService,
  usuariosService,
  calificacionesService,
} from "../services/api";

const AuthContext = createContext();

// Configurar modo de conexión: 'api' o 'local'
const MODO_CONEXION = process.env.NEXT_PUBLIC_MODE || "api";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};

// Usuarios de ejemplo para simular base de datos
const usuariosIniciales = [
  // Usuario ADMIN oculto - no aparece en listas públicas
  {
    id: "ADMIN-001",
    email: "pabloelleproso@gmail.com",
    password: "P@blo31286370",
    tipoUsuario: "admin",
    nombre: "Pablo (Admin)",
    telefono: "",
    direccion: "",
    foto: null,
    fechaRegistro: "2025-01-01",
    esOculto: true, // No aparece en búsquedas normales
  },
  {
    id: "CLI-001",
    email: "cliente@test.com",
    password: "123456",
    tipoUsuario: "cliente",
    nombre: "María García",
    telefono: "11-2345-6789",
    direccion: "Av. Corrientes 1234, CABA",
    foto: null,
    datosFiscales: {
      cuit: "20-12345678-9",
      condicionIva: "Responsable Inscripto",
      razonSocial: "María García",
      domicilioFiscal: "Av. Corrientes 1234, CABA",
    },
    fechaRegistro: "2025-01-15",
    calificaciones: [
      {
        id: 1001,
        idCalificador: "DEP-001",
        nombreCalificador: "Depósito Central",
        tipoCalificador: "deposito",
        puntuacion: 5,
        comentario: "Excelente cliente, siempre puntual con los pagos",
        fecha: "2025-01-20T10:30:00Z",
      },
      {
        id: 1002,
        idCalificador: "FLT-001",
        nombreCalificador: "Juan Conductor",
        tipoCalificador: "flete",
        puntuacion: 4,
        comentario: "Muy amable, buena comunicación",
        fecha: "2025-01-22T15:45:00Z",
      },
    ],
  },
  {
    id: "DEP-001",
    email: "deposito@test.com",
    password: "123456",
    tipoUsuario: "deposito",
    nombre: "Depósito Central",
    telefono: "11-9876-5432",
    direccion: "Zona Industrial, Lote 5",
    foto: null,
    horarioApertura: "08:00",
    horarioCierre: "18:00",
    diasLaborales: [1, 2, 3, 4, 5], // Lunes a Viernes
    datosFiscales: {
      cuit: "30-98765432-1",
      condicionIva: "Responsable Inscripto",
      razonSocial: "Distribuidora Central S.A.",
      domicilioFiscal: "Zona Industrial, Lote 5",
    },
    fechaRegistro: "2025-01-10",
    calificaciones: [
      {
        id: 2001,
        idCalificador: "CLI-001",
        nombreCalificador: "María García",
        tipoCalificador: "cliente",
        puntuacion: 5,
        comentario: "Excelente servicio, productos de calidad",
        fecha: "2025-01-18T14:20:00Z",
      },
      {
        id: 2002,
        idCalificador: "FLT-001",
        nombreCalificador: "Juan Conductor",
        tipoCalificador: "flete",
        puntuacion: 4,
        comentario: "Buenos productos, preparación rápida",
        fecha: "2025-01-19T09:15:00Z",
      },
    ],
  },
  {
    id: "FLT-001",
    email: "flete@test.com",
    password: "123456",
    tipoUsuario: "flete",
    nombre: "Juan Conductor",
    telefono: "11-5555-4444",
    direccion: "Barrio Norte, CABA",
    foto: null,
    horarioInicio: "07:00",
    horarioFin: "20:00",
    diasDisponibles: [1, 2, 3, 4, 5, 6], // Lunes a Sábado
    datosFiscales: {
      cuit: "20-55554444-3",
      condicionIva: "Monotributista",
      razonSocial: "Juan Conductor",
      domicilioFiscal: "Barrio Norte, CABA",
    },
    licencia: "B2",
    fechaRegistro: "2025-01-20",
    calificaciones: [
      {
        id: 3001,
        idCalificador: "CLI-001",
        nombreCalificador: "María García",
        tipoCalificador: "cliente",
        puntuacion: 5,
        comentario: "Muy puntual y cuidadoso con los paquetes",
        fecha: "2025-01-21T16:30:00Z",
      },
      {
        id: 3002,
        idCalificador: "DEP-001",
        nombreCalificador: "Depósito Central",
        tipoCalificador: "deposito",
        puntuacion: 4,
        comentario: "Buen conductor, confiable",
        fecha: "2025-01-23T11:00:00Z",
      },
    ],
  },
];

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const cargarDatos = async () => {
      // Modo API - intentar cargar usuario desde el token
      if (MODO_CONEXION === "api") {
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const response = await authService.getMe();
            if (response.usuario) {
              const usuarioMapeado = mapearUsuarioBackend(response.usuario);
              setUsuario(usuarioMapeado);
              localStorage.setItem(
                "repartos_usuario_actual",
                JSON.stringify(usuarioMapeado),
              );
            }
          } catch (error) {
            console.error("Error al cargar usuario:", error);
            // Token inválido, limpiar
            localStorage.removeItem("token");
            localStorage.removeItem("repartos_usuario_actual");
          }
        }
        setCargando(false);
        return;
      }

      // Modo local
      const usuariosGuardados = localStorage.getItem("repartos_usuarios");
      const usuarioActual = localStorage.getItem("repartos_usuario_actual");

      if (usuariosGuardados) {
        setUsuarios(JSON.parse(usuariosGuardados));
      } else {
        setUsuarios(usuariosIniciales);
        localStorage.setItem(
          "repartos_usuarios",
          JSON.stringify(usuariosIniciales),
        );
      }

      if (usuarioActual) {
        setUsuario(JSON.parse(usuarioActual));
      }

      setCargando(false);
    };

    cargarDatos();
  }, []);

  // Guardar usuarios cuando cambien
  useEffect(() => {
    if (usuarios.length > 0) {
      localStorage.setItem("repartos_usuarios", JSON.stringify(usuarios));
    }
  }, [usuarios]);

  // Guardar usuario actual cuando cambie
  useEffect(() => {
    if (usuario) {
      localStorage.setItem("repartos_usuario_actual", JSON.stringify(usuario));
    }
  }, [usuario]);

  const login = async (email, password) => {
    // Modo API - conectar con el backend
    if (MODO_CONEXION === "api") {
      try {
        const response = await authService.login(email, password);
        console.log("Login response:", response); // Debug
        // La respuesta puede venir como { usuario, token } directamente
        const usuario = response.usuario || response.data?.usuario;
        if (usuario) {
          // Mapear campos del backend al formato del frontend
          const usuarioMapeado = mapearUsuarioBackend(usuario);
          setUsuario(usuarioMapeado);
          localStorage.setItem(
            "repartos_usuario_actual",
            JSON.stringify(usuarioMapeado),
          );
          return { success: true, usuario: usuarioMapeado };
        }
        return { success: false, error: "Error en el login" };
      } catch (error) {
        console.error("Login error:", error); // Debug
        return {
          success: false,
          error: error.message || "Email o contraseña incorrectos",
        };
      }
    }

    // Modo local - usar localStorage
    const usuarioEncontrado = usuarios.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() &&
        u.password === password,
    );

    if (usuarioEncontrado) {
      // Verificar si la cuenta está desactivada
      if (usuarioEncontrado.desactivado) {
        return {
          success: false,
          error: "Esta cuenta ha sido desactivada. Contacte al administrador.",
        };
      }
      setUsuario(usuarioEncontrado);
      return { success: true, usuario: usuarioEncontrado };
    }

    return { success: false, error: "Email o contraseña incorrectos" };
  };

  // Función para mapear usuario del backend al formato del frontend
  const mapearUsuarioBackend = (usuarioBackend) => {
    return {
      id: usuarioBackend.id,
      email: usuarioBackend.email,
      tipoUsuario: usuarioBackend.tipo_usuario || usuarioBackend.tipoUsuario,
      nombre: usuarioBackend.nombre,
      telefono: usuarioBackend.telefono || "",
      direccion: usuarioBackend.direccion || "",
      foto: usuarioBackend.foto,
      descripcion: usuarioBackend.descripcion || "",
      horarioApertura:
        usuarioBackend.horario_apertura || usuarioBackend.horarioApertura,
      horarioCierre:
        usuarioBackend.horario_cierre || usuarioBackend.horarioCierre,
      diasLaborales:
        usuarioBackend.dias_laborales || usuarioBackend.diasLaborales,
      tiposEnvio: usuarioBackend.tipos_envio || usuarioBackend.tiposEnvio,
      capacidadMaxima:
        usuarioBackend.capacidad_maxima || usuarioBackend.capacidadMaxima,
      alertaStockMinimo:
        usuarioBackend.alerta_stock_minimo || usuarioBackend.alertaStockMinimo,
      vehiculoTipo: usuarioBackend.vehiculo_tipo || usuarioBackend.vehiculoTipo,
      vehiculoPatente:
        usuarioBackend.vehiculo_patente || usuarioBackend.vehiculoPatente,
      vehiculoCapacidad:
        usuarioBackend.vehiculo_capacidad || usuarioBackend.vehiculoCapacidad,
      licenciaTipo: usuarioBackend.licencia_tipo || usuarioBackend.licenciaTipo,
      licenciaVencimiento:
        usuarioBackend.licencia_vencimiento ||
        usuarioBackend.licenciaVencimiento,
      datosFiscales:
        usuarioBackend.datos_fiscales || usuarioBackend.datosFiscales || {},
      activo: usuarioBackend.activo !== false,
      desactivado: usuarioBackend.activo === false,
      esOculto: usuarioBackend.es_oculto || usuarioBackend.esOculto,
      fechaRegistro: usuarioBackend.created_at || usuarioBackend.createdAt,
      calificaciones: usuarioBackend.calificaciones || [],
    };
  };

  const registro = async (datosRegistro) => {
    // Modo API - conectar con el backend
    if (MODO_CONEXION === "api") {
      try {
        const response = await authService.registro({
          email: datosRegistro.email,
          password: datosRegistro.password,
          tipoUsuario: datosRegistro.tipoUsuario,
          nombre: datosRegistro.nombre,
          telefono: datosRegistro.telefono,
          direccion: datosRegistro.direccion,
        });

        if (response.usuario) {
          const usuarioMapeado = mapearUsuarioBackend(response.usuario);
          setUsuario(usuarioMapeado);
          localStorage.setItem(
            "repartos_usuario_actual",
            JSON.stringify(usuarioMapeado),
          );
          return { success: true, usuario: usuarioMapeado };
        }
        return { success: false, error: "Error en el registro" };
      } catch (error) {
        return {
          success: false,
          error: error.message || "Error al registrar usuario",
        };
      }
    }

    // Modo local - usar localStorage
    // Verificar si el email ya existe
    const emailExiste = usuarios.some(
      (u) => u.email.toLowerCase() === datosRegistro.email.toLowerCase(),
    );

    if (emailExiste) {
      return { success: false, error: "El email ya está registrado" };
    }

    // Generar ID según tipo de usuario
    const prefijos = { cliente: "CLI", deposito: "DEP", flete: "FLT" };
    const prefijo = prefijos[datosRegistro.tipoUsuario];
    const cantidad = usuarios.filter(
      (u) => u.tipoUsuario === datosRegistro.tipoUsuario,
    ).length;
    const nuevoId = `${prefijo}-${String(cantidad + 1).padStart(3, "0")}`;

    const nuevoUsuario = {
      id: nuevoId,
      email: datosRegistro.email,
      password: datosRegistro.password,
      tipoUsuario: datosRegistro.tipoUsuario,
      nombre: datosRegistro.nombre,
      telefono: datosRegistro.telefono || "",
      direccion: datosRegistro.direccion || "",
      foto: null,
      datosFiscales: {
        cuit: "",
        condicionIva: "",
        razonSocial: datosRegistro.nombre,
        domicilioFiscal: "",
      },
      fechaRegistro: new Date().toISOString().split("T")[0],
    };

    // Agregar campos específicos según tipo
    if (datosRegistro.tipoUsuario === "flete") {
      nuevoUsuario.licencia = datosRegistro.licencia || "";
    }

    setUsuarios((prev) => [...prev, nuevoUsuario]);
    setUsuario(nuevoUsuario);

    return { success: true, usuario: nuevoUsuario };
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem("repartos_usuario_actual");

    // En modo API, también limpiar el token
    if (MODO_CONEXION === "api") {
      authService.logout();
    }

    router.push("/");
  };

  const actualizarPerfil = async (datosActualizados) => {
    // Modo API
    if (MODO_CONEXION === "api") {
      try {
        const response = await authService.actualizarPerfil(datosActualizados);
        const usuarioData = response.data?.usuario || response.usuario;
        if (usuarioData) {
          const usuarioMapeado = mapearUsuarioBackend(usuarioData);
          setUsuario(usuarioMapeado);
          localStorage.setItem(
            "repartos_usuario_actual",
            JSON.stringify(usuarioMapeado),
          );
          return { success: true };
        }
        return { success: false, error: "Error al actualizar perfil" };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    // Modo local
    const usuarioActualizado = { ...usuario, ...datosActualizados };

    setUsuario(usuarioActualizado);
    setUsuarios((prev) =>
      prev.map((u) => (u.id === usuario.id ? usuarioActualizado : u)),
    );

    return { success: true };
  };

  const actualizarFoto = async (fotoBase64) => {
    // Modo API
    if (MODO_CONEXION === "api") {
      try {
        const response = await authService.actualizarPerfil({
          foto: fotoBase64,
        });
        const usuarioData = response.data?.usuario || response.usuario;
        if (usuarioData) {
          const usuarioMapeado = mapearUsuarioBackend(usuarioData);
          setUsuario(usuarioMapeado);
          localStorage.setItem(
            "repartos_usuario_actual",
            JSON.stringify(usuarioMapeado),
          );
          return { success: true };
        }
        return { success: false, error: "Error al actualizar foto" };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    // Modo local
    const usuarioActualizado = { ...usuario, foto: fotoBase64 };

    setUsuario(usuarioActualizado);
    setUsuarios((prev) =>
      prev.map((u) => (u.id === usuario.id ? usuarioActualizado : u)),
    );

    return { success: true };
  };

  const actualizarDatosFiscales = async (datosFiscales) => {
    // Modo API
    if (MODO_CONEXION === "api") {
      try {
        const nuevosDatosFiscales = {
          ...usuario.datosFiscales,
          ...datosFiscales,
        };
        const response = await authService.actualizarPerfil({
          datosFiscales: nuevosDatosFiscales,
        });
        const usuarioData = response.data?.usuario || response.usuario;
        if (usuarioData) {
          const usuarioMapeado = mapearUsuarioBackend(usuarioData);
          setUsuario(usuarioMapeado);
          localStorage.setItem(
            "repartos_usuario_actual",
            JSON.stringify(usuarioMapeado),
          );
          return { success: true };
        }
        return { success: false, error: "Error al actualizar datos fiscales" };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    // Modo local
    const usuarioActualizado = {
      ...usuario,
      datosFiscales: { ...usuario.datosFiscales, ...datosFiscales },
    };

    setUsuario(usuarioActualizado);
    setUsuarios((prev) =>
      prev.map((u) => (u.id === usuario.id ? usuarioActualizado : u)),
    );

    return { success: true };
  };

  const cambiarPassword = async (passwordActual, passwordNueva) => {
    // Modo API
    if (MODO_CONEXION === "api") {
      try {
        await authService.cambiarPassword(passwordActual, passwordNueva);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error.message || "Error al cambiar contraseña",
        };
      }
    }

    // Modo local
    if (usuario.password !== passwordActual) {
      return { success: false, error: "La contraseña actual es incorrecta" };
    }

    const usuarioActualizado = { ...usuario, password: passwordNueva };

    setUsuario(usuarioActualizado);
    setUsuarios((prev) =>
      prev.map((u) => (u.id === usuario.id ? usuarioActualizado : u)),
    );

    return { success: true };
  };

  const eliminarCuenta = () => {
    const idUsuario = usuario.id;

    // Eliminar usuario de la lista
    setUsuarios((prev) => prev.filter((u) => u.id !== idUsuario));

    // Cerrar sesión
    setUsuario(null);
    localStorage.removeItem("repartos_usuario_actual");

    // Actualizar localStorage con la lista actualizada
    const usuariosActualizados = usuarios.filter((u) => u.id !== idUsuario);
    localStorage.setItem(
      "repartos_usuarios",
      JSON.stringify(usuariosActualizados),
    );

    router.push("/");
    return { success: true };
  };

  // ============ FUNCIONES DE ADMINISTRADOR ============

  // Verificar si el usuario actual es admin
  const esAdmin = usuario?.tipoUsuario === "admin";

  // Obtener usuarios visibles (excluye admin y usuarios ocultos para no-admins)
  const getUsuariosVisibles = async () => {
    if (!esAdmin) return [];

    // Modo API
    if (MODO_CONEXION === "api") {
      try {
        const response = await usuariosService.getAll();
        console.log("Respuesta de usuarios:", response);
        // El backend devuelve { success, data: [...usuarios] }
        const usuariosBackend = response.data || response.usuarios || response;
        if (!Array.isArray(usuariosBackend)) {
          console.error("Los usuarios no son un array:", usuariosBackend);
          return [];
        }
        return usuariosBackend
          .filter((u) => u.tipoUsuario !== "admin")
          .map(mapearUsuarioBackend);
      } catch (error) {
        console.error("Error al obtener usuarios:", error);
        return [];
      }
    }

    // Modo local
    return usuarios.filter((u) => u.tipoUsuario !== "admin");
  };

  // Borrado lógico - Desactivar cuenta (solo admin)
  const desactivarCuenta = async (idUsuario) => {
    if (!esAdmin) return { success: false, error: "No autorizado" };
    if (idUsuario === usuario.id)
      return { success: false, error: "No puedes desactivar tu propia cuenta" };

    // Modo API
    if (MODO_CONEXION === "api") {
      try {
        await usuariosService.desactivar(idUsuario);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    // Modo local
    const usuarioObjetivo = usuarios.find((u) => u.id === idUsuario);
    if (!usuarioObjetivo)
      return { success: false, error: "Usuario no encontrado" };
    if (usuarioObjetivo.tipoUsuario === "admin")
      return { success: false, error: "No se puede desactivar un admin" };

    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === idUsuario
          ? {
              ...u,
              desactivado: true,
              fechaDesactivacion: new Date().toISOString(),
            }
          : u,
      ),
    );

    return { success: true };
  };

  // Reactivar cuenta (solo admin)
  const reactivarCuenta = async (idUsuario) => {
    if (!esAdmin) return { success: false, error: "No autorizado" };

    // Modo API
    if (MODO_CONEXION === "api") {
      try {
        await usuariosService.activar(idUsuario);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    // Modo local
    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === idUsuario
          ? { ...u, desactivado: false, fechaDesactivacion: null }
          : u,
      ),
    );

    return { success: true };
  };

  // Borrado permanente (solo admin)
  const eliminarCuentaPermanente = async (idUsuario) => {
    if (!esAdmin) return { success: false, error: "No autorizado" };
    if (idUsuario === usuario.id)
      return { success: false, error: "No puedes eliminar tu propia cuenta" };

    // Modo API
    if (MODO_CONEXION === "api") {
      try {
        await usuariosService.eliminar(idUsuario);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    // Modo local
    const usuarioObjetivo = usuarios.find((u) => u.id === idUsuario);
    if (!usuarioObjetivo)
      return { success: false, error: "Usuario no encontrado" };
    if (usuarioObjetivo.tipoUsuario === "admin")
      return { success: false, error: "No se puede eliminar un admin" };

    const usuariosActualizados = usuarios.filter((u) => u.id !== idUsuario);
    setUsuarios(usuariosActualizados);
    localStorage.setItem(
      "repartos_usuarios",
      JSON.stringify(usuariosActualizados),
    );

    return { success: true };
  };

  // ============ SISTEMA DE CALIFICACIONES ============

  // Calificar a un usuario
  const calificarUsuario = async (
    idUsuarioCalificado,
    puntuacion,
    comentario = "",
    pedidoId = null,
  ) => {
    if (!usuario) return { success: false, error: "Debes iniciar sesión" };
    if (idUsuarioCalificado === usuario.id)
      return { success: false, error: "No puedes calificarte a ti mismo" };
    if (puntuacion < 1 || puntuacion > 5)
      return { success: false, error: "La puntuación debe ser entre 1 y 5" };

    // Modo API
    if (MODO_CONEXION === "api") {
      try {
        await calificacionesService.crear({
          calificadoId: idUsuarioCalificado,
          puntuacion,
          comentario,
          pedidoId,
        });
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }

    // Modo local
    const usuarioCalificado = usuarios.find(
      (u) => u.id === idUsuarioCalificado,
    );
    if (!usuarioCalificado)
      return { success: false, error: "Usuario no encontrado" };
    if (usuarioCalificado.tipoUsuario === "admin")
      return { success: false, error: "No se puede calificar a un admin" };

    const nuevaCalificacion = {
      id: Date.now(),
      idCalificador: usuario.id,
      nombreCalificador: usuario.nombre,
      tipoCalificador: usuario.tipoUsuario,
      puntuacion,
      comentario,
      fecha: new Date().toISOString(),
    };

    // Verificar si ya calificó a este usuario
    const calificacionesActuales = usuarioCalificado.calificaciones || [];
    const yaCalificado = calificacionesActuales.find(
      (c) => c.idCalificador === usuario.id,
    );

    let nuevasCalificaciones;
    if (yaCalificado) {
      // Actualizar calificación existente
      nuevasCalificaciones = calificacionesActuales.map((c) =>
        c.idCalificador === usuario.id ? nuevaCalificacion : c,
      );
    } else {
      // Agregar nueva calificación
      nuevasCalificaciones = [...calificacionesActuales, nuevaCalificacion];
    }

    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === idUsuarioCalificado
          ? { ...u, calificaciones: nuevasCalificaciones }
          : u,
      ),
    );

    return { success: true, actualizado: !!yaCalificado };
  };

  // Obtener calificaciones de un usuario
  const getCalificacionesUsuario = async (idUsuario) => {
    // Modo API
    if (MODO_CONEXION === "api") {
      try {
        const response = await calificacionesService.getByUsuario(idUsuario);
        // El backend devuelve { success, data: { calificaciones, promedio, total } }
        const calificaciones =
          response.data?.calificaciones ||
          response.calificaciones ||
          response ||
          [];
        return Array.isArray(calificaciones) ? calificaciones : [];
      } catch (error) {
        console.error("Error al obtener calificaciones:", error);
        return [];
      }
    }

    // Modo local
    const usuarioBuscado = usuarios.find((u) => u.id === idUsuario);
    return usuarioBuscado?.calificaciones || [];
  };

  // Obtener promedio de calificaciones de un usuario
  const getPromedioCalificaciones = async (idUsuario) => {
    const calificaciones = await getCalificacionesUsuario(idUsuario);
    if (!Array.isArray(calificaciones) || calificaciones.length === 0) return 0;
    const suma = calificaciones.reduce((acc, c) => acc + c.puntuacion, 0);
    return suma / calificaciones.length;
  };

  // Obtener estadísticas de calificaciones para admin
  const getEstadisticasCalificaciones = async () => {
    // Modo API
    if (MODO_CONEXION === "api") {
      try {
        const response = await calificacionesService.getEstadisticas();
        return (
          response.data ||
          response || {
            ranking: [],
            statsPorTipo: [],
            totalCalificaciones: 0,
            promedioGlobal: 0,
          }
        );
      } catch (error) {
        console.error("Error al obtener estadísticas:", error);
        return {
          ranking: [],
          statsPorTipo: [],
          totalCalificaciones: 0,
          promedioGlobal: 0,
        };
      }
    }

    // Modo local - usar datos del estado
    const usuariosConCalificaciones = usuarios.filter(
      (u) => u.tipoUsuario !== "admin" && u.calificaciones?.length > 0,
    );

    const todosLosUsuarios = usuarios.filter((u) => u.tipoUsuario !== "admin");

    // Top calificados
    const ranking = todosLosUsuarios
      .map((u) => ({
        id: u.id,
        nombre: u.nombre,
        tipo: u.tipoUsuario,
        foto: u.foto,
        fechaRegistro: u.fechaRegistro,
        calificaciones: u.calificaciones || [],
        promedio:
          u.calificaciones?.length > 0
            ? u.calificaciones.reduce((acc, c) => acc + c.puntuacion, 0) /
              u.calificaciones.length
            : 0,
        totalCalificaciones: u.calificaciones?.length || 0,
      }))
      .filter((u) => u.totalCalificaciones > 0)
      .sort((a, b) => b.promedio - a.promedio);

    // Estadísticas por tipo
    const statsPorTipo = ["cliente", "deposito", "flete"].map((tipo) => {
      const usuariosTipo = todosLosUsuarios.filter(
        (u) => u.tipoUsuario === tipo,
      );
      const conCalificaciones = usuariosTipo.filter(
        (u) => u.calificaciones?.length > 0,
      );
      const todasCalificaciones = conCalificaciones.flatMap(
        (u) => u.calificaciones || [],
      );

      return {
        tipo,
        totalUsuarios: usuariosTipo.length,
        usuariosConCalificaciones: conCalificaciones.length,
        totalCalificaciones: todasCalificaciones.length,
        promedioGeneral:
          todasCalificaciones.length > 0
            ? todasCalificaciones.reduce((acc, c) => acc + c.puntuacion, 0) /
              todasCalificaciones.length
            : 0,
      };
    });

    // Total global
    const todasLasCalificaciones = todosLosUsuarios.flatMap(
      (u) => u.calificaciones || [],
    );

    return {
      ranking,
      statsPorTipo,
      totalCalificaciones: todasLasCalificaciones.length,
      promedioGlobal:
        todasLasCalificaciones.length > 0
          ? todasLasCalificaciones.reduce((acc, c) => acc + c.puntuacion, 0) /
            todasLasCalificaciones.length
          : 0,
    };
  };

  const estaAutenticado = !!usuario;

  const getRutaInicio = () => {
    if (!usuario) return "/auth/login";
    const rutas = {
      cliente: "/clientes",
      deposito: "/depositos",
      flete: "/fletes",
      admin: "/admin",
    };
    return rutas[usuario.tipoUsuario] || "/";
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        usuarios,
        cargando,
        estaAutenticado,
        esAdmin,
        login,
        registro,
        logout,
        actualizarPerfil,
        actualizarFoto,
        actualizarDatosFiscales,
        cambiarPassword,
        eliminarCuenta,
        getRutaInicio,
        // Funciones de admin
        getUsuariosVisibles,
        desactivarCuenta,
        reactivarCuenta,
        eliminarCuentaPermanente,
        // Funciones de calificaciones
        calificarUsuario,
        getCalificacionesUsuario,
        getPromedioCalificaciones,
        getEstadisticasCalificaciones,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
