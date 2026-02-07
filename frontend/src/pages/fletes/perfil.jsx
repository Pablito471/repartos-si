import { useState, useRef } from "react";
import FleteLayout from "@/components/layouts/FleteLayout";
import { useAuth } from "@/context/AuthContext";
import { formatDate, DIAS_SEMANA } from "@/utils/formatters";
import Swal from "sweetalert2";

export default function PerfilFlete() {
  const {
    usuario,
    actualizarPerfil,
    actualizarFoto,
    actualizarDatosFiscales,
    cambiarPassword,
    eliminarCuenta,
  } = useAuth();

  const [seccionActiva, setSeccionActiva] = useState("perfil");
  const [editando, setEditando] = useState(false);
  const [formPerfil, setFormPerfil] = useState({
    nombre: usuario?.nombre || "",
    telefono: usuario?.telefono || "",
    direccion: usuario?.direccion || "",
    email: usuario?.email || "",
    licenciaTipo: usuario?.licenciaTipo || usuario?.licencia || "",
    licenciaVencimiento: usuario?.licenciaVencimiento || "",
    vehiculoTipo: usuario?.vehiculoTipo || "",
    vehiculoPatente: usuario?.vehiculoPatente || "",
    vehiculoCapacidad: usuario?.vehiculoCapacidad || "",
    disponibilidad: usuario?.disponibilidad || "completa",
    horarioInicio: usuario?.horarioInicio || "07:00",
    horarioFin: usuario?.horarioFin || "20:00",
    diasDisponibles: usuario?.diasDisponibles || [1, 2, 3, 4, 5, 6], // Lun-Sáb por defecto
  });
  const [formFiscal, setFormFiscal] = useState({
    cuit: usuario?.datosFiscales?.cuit || "",
    condicionIva: usuario?.datosFiscales?.condicionIva || "",
    razonSocial: usuario?.datosFiscales?.razonSocial || "",
    domicilioFiscal: usuario?.datosFiscales?.domicilioFiscal || "",
  });
  const [formPassword, setFormPassword] = useState({
    actual: "",
    nueva: "",
    confirmar: "",
  });

  const fileInputRef = useRef(null);

  const secciones = [
    { id: "perfil", label: "Datos Personales", icon: "👤" },
    { id: "horarios", label: "Disponibilidad Horaria", icon: "🕒" },
    { id: "fiscal", label: "Datos Fiscales", icon: "📄" },
    { id: "seguridad", label: "Seguridad", icon: "🔒" },
    { id: "eliminar", label: "Eliminar Cuenta", icon: "🗑️" },
  ];

  const condicionesIva = ["Responsable Inscripto", "Monotributista", "Exento"];

  const tiposLicencia = [
    { value: "B1", label: "B1 - Automóviles" },
    { value: "B2", label: "B2 - Camionetas" },
    { value: "C", label: "C - Camiones" },
    { value: "D", label: "D - Transporte de pasajeros" },
    { value: "E", label: "E - Vehículos pesados" },
  ];

  const tiposVehiculo = [
    { value: "moto", label: "Moto" },
    { value: "auto", label: "Auto" },
    { value: "camioneta", label: "Camioneta" },
    { value: "utilitario", label: "Utilitario" },
    { value: "camion_chico", label: "Camión Chico" },
    { value: "camion", label: "Camión" },
  ];

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire({
          icon: "error",
          title: "Archivo muy grande",
          text: "La imagen no debe superar los 2MB",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        actualizarFoto(reader.result);
        Swal.fire({
          icon: "success",
          title: "Foto actualizada",
          timer: 1500,
          showConfirmButton: false,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const guardarPerfil = () => {
    actualizarPerfil(formPerfil);
    setEditando(false);
    Swal.fire({
      icon: "success",
      title: "Perfil actualizado",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const guardarDatosFiscales = () => {
    actualizarDatosFiscales(formFiscal);
    Swal.fire({
      icon: "success",
      title: "Datos fiscales actualizados",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleCambiarPassword = (e) => {
    e.preventDefault();

    if (formPassword.nueva.length < 6) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "La nueva contraseña debe tener al menos 6 caracteres",
      });
      return;
    }

    if (formPassword.nueva !== formPassword.confirmar) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Las contraseñas no coinciden",
      });
      return;
    }

    const resultado = cambiarPassword(formPassword.actual, formPassword.nueva);

    if (resultado.success) {
      Swal.fire({
        icon: "success",
        title: "Contraseña actualizada",
        timer: 1500,
        showConfirmButton: false,
      });
      setFormPassword({ actual: "", nueva: "", confirmar: "" });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: resultado.error,
      });
    }
  };

  if (!usuario) return null;

  return (
    <FleteLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mi Perfil</h1>
          <p className="text-gray-600">
            Gestiona tu información de transportista
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar con foto y menú */}
          <div className="lg:col-span-1 space-y-4">
            {/* Card de foto */}
            <div className="card text-center">
              <div className="relative inline-block">
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  {usuario.foto ? (
                    <img
                      src={usuario.foto}
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl text-white">
                      {usuario.nombre.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600 transition-colors shadow-lg"
                >
                  📷
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFotoChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <h3 className="mt-4 font-semibold text-gray-800">
                {usuario.nombre}
              </h3>
              <p className="text-sm text-gray-500">{usuario.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                🚚 Transportista
              </span>
              <p className="text-xs text-gray-400 mt-2">
                Activo desde {formatDate(usuario.fechaRegistro)}
              </p>
            </div>

            {/* Menú de secciones */}
            <div className="card p-2">
              {secciones.map((seccion) => (
                <button
                  key={seccion.id}
                  onClick={() => setSeccionActiva(seccion.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    seccionActiva === seccion.id
                      ? "bg-orange-100 text-orange-700"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <span>{seccion.icon}</span>
                  <span className="font-medium">{seccion.label}</span>
                </button>
              ))}
            </div>

            {/* Info adicional */}
            <div className="card bg-orange-50">
              <h4 className="font-medium text-orange-800 mb-2">
                Estado Actual
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Licencia:</span>
                  <span className="font-medium">
                    {usuario.licenciaTipo || "No especificada"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vehículo:</span>
                  <span className="font-medium capitalize">
                    {usuario.vehiculoTipo || "No especificado"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Patente:</span>
                  <span className="font-medium uppercase">
                    {usuario.vehiculoPatente || "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-3">
            {/* Datos Personales */}
            {seccionActiva === "perfil" && (
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Datos Personales
                  </h2>
                  <button
                    onClick={() => setEditando(!editando)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      editando
                        ? "bg-gray-200 text-gray-700"
                        : "bg-orange-500 text-white hover:bg-orange-600"
                    }`}
                  >
                    {editando ? "Cancelar" : "✏️ Editar"}
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre completo
                      </label>
                      {editando ? (
                        <input
                          type="text"
                          value={formPerfil.nombre}
                          onChange={(e) =>
                            setFormPerfil({
                              ...formPerfil,
                              nombre: e.target.value,
                            })
                          }
                          className="input-field w-full"
                        />
                      ) : (
                        <p className="p-3 bg-gray-50 rounded-lg">
                          {usuario.nombre}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <p className="p-3 bg-gray-100 rounded-lg text-gray-500">
                        {usuario.email}
                        <span className="text-xs ml-2">(no editable)</span>
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      {editando ? (
                        <input
                          type="tel"
                          value={formPerfil.telefono}
                          onChange={(e) =>
                            setFormPerfil({
                              ...formPerfil,
                              telefono: e.target.value,
                            })
                          }
                          className="input-field w-full"
                        />
                      ) : (
                        <p className="p-3 bg-gray-50 rounded-lg">
                          {usuario.telefono || "No especificado"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Licencia
                      </label>
                      {editando ? (
                        <select
                          value={formPerfil.licenciaTipo}
                          onChange={(e) =>
                            setFormPerfil({
                              ...formPerfil,
                              licenciaTipo: e.target.value,
                            })
                          }
                          className="input-field w-full"
                        >
                          <option value="">Seleccionar...</option>
                          {tiposLicencia.map((lic) => (
                            <option key={lic.value} value={lic.value}>
                              {lic.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="p-3 bg-gray-50 rounded-lg">
                          {tiposLicencia.find(
                            (l) => l.value === usuario.licenciaTipo,
                          )?.label ||
                            usuario.licenciaTipo ||
                            "No especificada"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vencimiento de Licencia
                      </label>
                      {editando ? (
                        <input
                          type="date"
                          value={formPerfil.licenciaVencimiento}
                          onChange={(e) =>
                            setFormPerfil({
                              ...formPerfil,
                              licenciaVencimiento: e.target.value,
                            })
                          }
                          className="input-field w-full"
                        />
                      ) : (
                        <p className="p-3 bg-gray-50 rounded-lg">
                          {usuario.licenciaVencimiento
                            ? new Date(
                                usuario.licenciaVencimiento,
                              ).toLocaleDateString()
                            : "No especificado"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Vehículo
                      </label>
                      {editando ? (
                        <select
                          value={formPerfil.vehiculoTipo}
                          onChange={(e) =>
                            setFormPerfil({
                              ...formPerfil,
                              vehiculoTipo: e.target.value,
                            })
                          }
                          className="input-field w-full"
                        >
                          <option value="">Seleccionar...</option>
                          {tiposVehiculo.map((v) => (
                            <option key={v.value} value={v.value}>
                              {v.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="p-3 bg-gray-50 rounded-lg capitalize">
                          {tiposVehiculo.find(
                            (v) => v.value === usuario.vehiculoTipo,
                          )?.label ||
                            usuario.vehiculoTipo ||
                            "No especificado"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Patente del Vehículo
                      </label>
                      {editando ? (
                        <input
                          type="text"
                          value={formPerfil.vehiculoPatente}
                          onChange={(e) =>
                            setFormPerfil({
                              ...formPerfil,
                              vehiculoPatente: e.target.value.toUpperCase(),
                            })
                          }
                          placeholder="Ej: ABC123"
                          className="input-field w-full uppercase"
                          maxLength={7}
                        />
                      ) : (
                        <p className="p-3 bg-gray-50 rounded-lg uppercase">
                          {usuario.vehiculoPatente || "No especificada"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Capacidad del Vehículo (kg)
                      </label>
                      {editando ? (
                        <input
                          type="number"
                          value={formPerfil.vehiculoCapacidad}
                          onChange={(e) =>
                            setFormPerfil({
                              ...formPerfil,
                              vehiculoCapacidad: e.target.value,
                            })
                          }
                          placeholder="Ej: 500"
                          className="input-field w-full"
                          min="0"
                        />
                      ) : (
                        <p className="p-3 bg-gray-50 rounded-lg">
                          {usuario.vehiculoCapacidad
                            ? `${usuario.vehiculoCapacidad} kg`
                            : "No especificada"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Disponibilidad
                      </label>
                      {editando ? (
                        <select
                          value={formPerfil.disponibilidad}
                          onChange={(e) =>
                            setFormPerfil({
                              ...formPerfil,
                              disponibilidad: e.target.value,
                            })
                          }
                          className="input-field w-full"
                        >
                          <option value="completa">Tiempo completo</option>
                          <option value="parcial">Medio tiempo</option>
                          <option value="fines_semana">
                            Solo fines de semana
                          </option>
                        </select>
                      ) : (
                        <p className="p-3 bg-gray-50 rounded-lg capitalize">
                          {formPerfil.disponibilidad === "completa"
                            ? "Tiempo completo"
                            : formPerfil.disponibilidad === "parcial"
                              ? "Medio tiempo"
                              : "Solo fines de semana"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    {editando ? (
                      <textarea
                        value={formPerfil.direccion}
                        onChange={(e) =>
                          setFormPerfil({
                            ...formPerfil,
                            direccion: e.target.value,
                          })
                        }
                        className="input-field w-full"
                        rows={2}
                      />
                    ) : (
                      <p className="p-3 bg-gray-50 rounded-lg">
                        {usuario.direccion || "No especificada"}
                      </p>
                    )}
                  </div>

                  {editando && (
                    <div className="flex justify-end">
                      <button
                        onClick={guardarPerfil}
                        className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        💾 Guardar Cambios
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Disponibilidad Horaria */}
            {seccionActiva === "horarios" && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">
                  🕒 Disponibilidad Horaria
                </h2>

                <div className="space-y-6">
                  {/* Info */}
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-orange-700 text-sm">
                      <strong>ℹ️ Importante:</strong> Los depósitos verán tu
                      disponibilidad según estos horarios. Solo recibirás envíos
                      asignados dentro de tu horario configurado.
                    </p>
                  </div>

                  {/* Días disponibles */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Días disponibles para trabajar
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DIAS_SEMANA.map((dia) => (
                        <button
                          key={dia.id}
                          type="button"
                          onClick={() => {
                            const diasActuales =
                              formPerfil.diasDisponibles || [];
                            let nuevosDias;
                            if (diasActuales.includes(dia.id)) {
                              nuevosDias = diasActuales.filter(
                                (d) => d !== dia.id,
                              );
                            } else {
                              nuevosDias = [...diasActuales, dia.id].sort(
                                (a, b) => a - b,
                              );
                            }
                            setFormPerfil({
                              ...formPerfil,
                              diasDisponibles: nuevosDias,
                            });
                          }}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            (formPerfil.diasDisponibles || []).includes(dia.id)
                              ? "bg-orange-500 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {dia.nombre}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Horarios */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hora de inicio disponibilidad
                      </label>
                      <input
                        type="time"
                        value={formPerfil.horarioInicio}
                        onChange={(e) =>
                          setFormPerfil({
                            ...formPerfil,
                            horarioInicio: e.target.value,
                          })
                        }
                        className="input-field w-full text-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hora de fin disponibilidad
                      </label>
                      <input
                        type="time"
                        value={formPerfil.horarioFin}
                        onChange={(e) =>
                          setFormPerfil({
                            ...formPerfil,
                            horarioFin: e.target.value,
                          })
                        }
                        className="input-field w-full text-lg"
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-700 mb-2">
                      Tu disponibilidad:
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">🚚</span>
                      <span className="text-gray-600">
                        {formPerfil.diasDisponibles?.length > 0
                          ? `${DIAS_SEMANA.filter((d) =>
                              formPerfil.diasDisponibles.includes(d.id),
                            )
                              .map((d) => d.abrev)
                              .join(", ")} `
                          : "Sin días configurados "}
                        de {formPerfil.horarioInicio} a {formPerfil.horarioFin}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        actualizarPerfil(formPerfil);
                        Swal.fire({
                          icon: "success",
                          title: "Disponibilidad actualizada",
                          timer: 1500,
                          showConfirmButton: false,
                        });
                      }}
                      className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      💾 Guardar Disponibilidad
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Datos Fiscales */}
            {seccionActiva === "fiscal" && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">
                  Datos Fiscales
                </h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CUIT
                      </label>
                      <input
                        type="text"
                        value={formFiscal.cuit}
                        onChange={(e) =>
                          setFormFiscal({ ...formFiscal, cuit: e.target.value })
                        }
                        className="input-field w-full"
                        placeholder="XX-XXXXXXXX-X"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Condición ante el IVA
                      </label>
                      <select
                        value={formFiscal.condicionIva}
                        onChange={(e) =>
                          setFormFiscal({
                            ...formFiscal,
                            condicionIva: e.target.value,
                          })
                        }
                        className="input-field w-full"
                      >
                        <option value="">Seleccionar...</option>
                        {condicionesIva.map((cond) => (
                          <option key={cond} value={cond}>
                            {cond}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Razón Social / Nombre
                      </label>
                      <input
                        type="text"
                        value={formFiscal.razonSocial}
                        onChange={(e) =>
                          setFormFiscal({
                            ...formFiscal,
                            razonSocial: e.target.value,
                          })
                        }
                        className="input-field w-full"
                        placeholder="Tu nombre o razón social"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Domicilio Fiscal
                      </label>
                      <textarea
                        value={formFiscal.domicilioFiscal}
                        onChange={(e) =>
                          setFormFiscal({
                            ...formFiscal,
                            domicilioFiscal: e.target.value,
                          })
                        }
                        className="input-field w-full"
                        rows={2}
                        placeholder="Dirección fiscal completa"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={guardarDatosFiscales}
                      className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      💾 Guardar Datos Fiscales
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Seguridad */}
            {seccionActiva === "seguridad" && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">
                  Cambiar Contraseña
                </h2>

                <form
                  onSubmit={handleCambiarPassword}
                  className="space-y-4 max-w-md"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña actual
                    </label>
                    <input
                      type="password"
                      value={formPassword.actual}
                      onChange={(e) =>
                        setFormPassword({
                          ...formPassword,
                          actual: e.target.value,
                        })
                      }
                      className="input-field w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nueva contraseña
                    </label>
                    <input
                      type="password"
                      value={formPassword.nueva}
                      onChange={(e) =>
                        setFormPassword({
                          ...formPassword,
                          nueva: e.target.value,
                        })
                      }
                      className="input-field w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmar nueva contraseña
                    </label>
                    <input
                      type="password"
                      value={formPassword.confirmar}
                      onChange={(e) =>
                        setFormPassword({
                          ...formPassword,
                          confirmar: e.target.value,
                        })
                      }
                      className="input-field w-full"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    🔒 Cambiar Contraseña
                  </button>
                </form>
              </div>
            )}

            {/* Sección Eliminar Cuenta */}
            {seccionActiva === "eliminar" && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-red-600 mb-4">
                  🗑️ Eliminar Cuenta
                </h2>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-700 mb-2">
                    <strong>⚠️ Advertencia:</strong> Esta acción es
                    irreversible.
                  </p>
                  <p className="text-red-600 text-sm">
                    Al eliminar tu cuenta, perderás todos tus datos, historial
                    de entregas, información del vehículo y configuraciones. No
                    podrás recuperar esta información.
                  </p>
                </div>
                <button
                  onClick={() => {
                    Swal.fire({
                      title: "¿Estás seguro?",
                      text: "Esta acción eliminará tu cuenta de transportista permanentemente",
                      icon: "warning",
                      showCancelButton: true,
                      confirmButtonColor: "#dc2626",
                      cancelButtonColor: "#6b7280",
                      confirmButtonText: "Sí, eliminar cuenta",
                      cancelButtonText: "Cancelar",
                    }).then((result) => {
                      if (result.isConfirmed) {
                        eliminarCuenta();
                        Swal.fire({
                          icon: "success",
                          title: "Cuenta eliminada",
                          text: "Tu cuenta ha sido eliminada exitosamente",
                          timer: 2000,
                          showConfirmButton: false,
                        });
                      }
                    });
                  }}
                  className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors font-semibold"
                >
                  🗑️ Eliminar mi cuenta permanentemente
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </FleteLayout>
  );
}
