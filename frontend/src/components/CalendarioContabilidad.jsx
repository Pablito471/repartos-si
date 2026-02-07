import { useState, useMemo, useCallback } from "react";

/**
 * Componente de Calendario de Contabilidad
 * Permite ver movimientos diarios, semanales, mensuales y anuales
 * @param {Array} movimientos - Array de movimientos con {fecha, tipo, monto, concepto}
 * @param {string} colorPrimary - Color primario del tema (blue, green, orange)
 */
export default function CalendarioContabilidad({
  movimientos = [],
  colorPrimary = "blue",
}) {
  const [vista, setVista] = useState("mensual"); // diaria, semanal, mensual, anual
  const [fechaActual, setFechaActual] = useState(new Date());

  const colorClasses = {
    blue: {
      header: "from-blue-500 to-blue-600",
      button: "bg-blue-500 hover:bg-blue-600",
      buttonActive: "bg-blue-600",
      badge: "bg-blue-100 text-blue-800",
      ring: "ring-blue-500",
    },
    green: {
      header: "from-green-500 to-green-600",
      button: "bg-green-500 hover:bg-green-600",
      buttonActive: "bg-green-600",
      badge: "bg-green-100 text-green-800",
      ring: "ring-green-500",
    },
    orange: {
      header: "from-orange-500 to-orange-600",
      button: "bg-orange-500 hover:bg-orange-600",
      buttonActive: "bg-orange-600",
      badge: "bg-orange-100 text-orange-800",
      ring: "ring-orange-500",
    },
  };

  const colors = colorClasses[colorPrimary] || colorClasses.blue;

  // Helpers de fecha
  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getNombreMes = (fecha) => {
    return fecha.toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric",
    });
  };

  const getNombreDia = (fecha) => {
    return fecha.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getSemanaDelAno = (fecha) => {
    const inicio = new Date(fecha.getFullYear(), 0, 1);
    const diff = fecha - inicio;
    const unaSemana = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil(diff / unaSemana);
  };

  // Navegación
  const navegarAnterior = () => {
    const nuevaFecha = new Date(fechaActual);
    switch (vista) {
      case "diaria":
        nuevaFecha.setDate(nuevaFecha.getDate() - 1);
        break;
      case "semanal":
        nuevaFecha.setDate(nuevaFecha.getDate() - 7);
        break;
      case "mensual":
        nuevaFecha.setMonth(nuevaFecha.getMonth() - 1);
        break;
      case "anual":
        nuevaFecha.setFullYear(nuevaFecha.getFullYear() - 1);
        break;
    }
    setFechaActual(nuevaFecha);
  };

  const navegarSiguiente = () => {
    const nuevaFecha = new Date(fechaActual);
    switch (vista) {
      case "diaria":
        nuevaFecha.setDate(nuevaFecha.getDate() + 1);
        break;
      case "semanal":
        nuevaFecha.setDate(nuevaFecha.getDate() + 7);
        break;
      case "mensual":
        nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);
        break;
      case "anual":
        nuevaFecha.setFullYear(nuevaFecha.getFullYear() + 1);
        break;
    }
    setFechaActual(nuevaFecha);
  };

  const irAHoy = () => {
    setFechaActual(new Date());
  };

  // Obtener rango de fechas según la vista
  const getRangoFechas = useCallback(() => {
    const inicio = new Date(fechaActual);
    const fin = new Date(fechaActual);

    switch (vista) {
      case "diaria":
        inicio.setHours(0, 0, 0, 0);
        fin.setHours(23, 59, 59, 999);
        break;
      case "semanal":
        const diaSemana = inicio.getDay();
        const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
        inicio.setDate(inicio.getDate() + diffLunes);
        inicio.setHours(0, 0, 0, 0);
        fin.setDate(inicio.getDate() + 6);
        fin.setHours(23, 59, 59, 999);
        break;
      case "mensual":
        inicio.setDate(1);
        inicio.setHours(0, 0, 0, 0);
        fin.setMonth(fin.getMonth() + 1, 0);
        fin.setHours(23, 59, 59, 999);
        break;
      case "anual":
        inicio.setMonth(0, 1);
        inicio.setHours(0, 0, 0, 0);
        fin.setMonth(11, 31);
        fin.setHours(23, 59, 59, 999);
        break;
    }

    return { inicio, fin };
  }, [fechaActual, vista]);

  // Helper para obtener fecha local normalizada (YYYY-MM-DD)
  const getFechaLocal = (fecha) => {
    if (!fecha) return "";
    // Si ya es un string YYYY-MM-DD, devolverlo directamente
    if (typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return fecha;
    }
    // Si es un Date object o ISO string, extraer fecha local
    const d = new Date(fecha);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // Filtrar movimientos por rango
  const movimientosFiltrados = useMemo(() => {
    const { inicio, fin } = getRangoFechas();
    const inicioStr = getFechaLocal(inicio);
    const finStr = getFechaLocal(fin);
    return movimientos.filter((mov) => {
      const fechaMov = getFechaLocal(mov.fecha || mov.createdAt);
      return fechaMov >= inicioStr && fechaMov <= finStr;
    });
  }, [movimientos, getRangoFechas]);

  // Calcular totales
  const totales = useMemo(() => {
    const ingresos = movimientosFiltrados
      .filter((m) => m.tipo === "ingreso")
      .reduce((sum, m) => sum + m.monto, 0);
    const egresos = movimientosFiltrados
      .filter((m) => m.tipo === "egreso")
      .reduce((sum, m) => sum + m.monto, 0);
    return { ingresos, egresos, balance: ingresos - egresos };
  }, [movimientosFiltrados]);

  // Obtener título del período
  const getTituloPeriodo = () => {
    const { inicio, fin } = getRangoFechas();
    switch (vista) {
      case "diaria":
        return getNombreDia(fechaActual);
      case "semanal":
        return `Semana ${getSemanaDelAno(fechaActual)} - ${formatearFecha(inicio)} al ${formatearFecha(fin)}`;
      case "mensual":
        return (
          getNombreMes(fechaActual).charAt(0).toUpperCase() +
          getNombreMes(fechaActual).slice(1)
        );
      case "anual":
        return `Año ${fechaActual.getFullYear()}`;
    }
  };

  // Generar días del mes para el calendario
  const getDiasDelMes = () => {
    const year = fechaActual.getFullYear();
    const month = fechaActual.getMonth();
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);

    const dias = [];

    // Días del mes anterior para completar la semana
    const primerDiaSemana = primerDia.getDay();
    const diasAnterior = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;
    for (let i = diasAnterior; i > 0; i--) {
      const fecha = new Date(year, month, 1 - i);
      dias.push({ fecha, esMesActual: false });
    }

    // Días del mes actual
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      dias.push({ fecha: new Date(year, month, dia), esMesActual: true });
    }

    // Días del mes siguiente para completar
    const diasRestantes = 42 - dias.length;
    for (let i = 1; i <= diasRestantes; i++) {
      const fecha = new Date(year, month + 1, i);
      dias.push({ fecha, esMesActual: false });
    }

    return dias;
  };

  // Obtener movimientos de un día específico
  const getMovimientosDia = (fecha) => {
    const fechaObjetivo = getFechaLocal(fecha);

    return movimientos.filter((mov) => {
      const fechaMov = getFechaLocal(mov.fecha || mov.createdAt);
      return fechaMov === fechaObjetivo;
    });
  };

  // Obtener totales de un día
  const getTotalesDia = (fecha) => {
    const movsDia = getMovimientosDia(fecha);
    const ingresos = movsDia
      .filter((m) => m.tipo === "ingreso")
      .reduce((s, m) => s + m.monto, 0);
    const egresos = movsDia
      .filter((m) => m.tipo === "egreso")
      .reduce((s, m) => s + m.monto, 0);
    return {
      ingresos,
      egresos,
      balance: ingresos - egresos,
      total: movsDia.length,
    };
  };

  // Generar datos para vista semanal
  const getDiasSemana = () => {
    const { inicio } = getRangoFechas();
    const dias = [];
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(inicio);
      fecha.setDate(fecha.getDate() + i);
      dias.push({
        fecha,
        nombre: fecha.toLocaleDateString("es-AR", { weekday: "short" }),
        ...getTotalesDia(fecha),
      });
    }
    return dias;
  };

  // Generar datos para vista anual (por mes)
  const getMesesAno = () => {
    const year = fechaActual.getFullYear();
    const meses = [];
    for (let mes = 0; mes < 12; mes++) {
      const inicio = new Date(year, mes, 1);
      const fin = new Date(year, mes + 1, 0);
      const inicioStr = getFechaLocal(inicio);
      const finStr = getFechaLocal(fin);

      const movsMes = movimientos.filter((mov) => {
        const fechaMov = getFechaLocal(mov.fecha || mov.createdAt);
        return fechaMov >= inicioStr && fechaMov <= finStr;
      });

      const ingresos = movsMes
        .filter((m) => m.tipo === "ingreso")
        .reduce((s, m) => s + m.monto, 0);
      const egresos = movsMes
        .filter((m) => m.tipo === "egreso")
        .reduce((s, m) => s + m.monto, 0);

      meses.push({
        mes,
        nombre: inicio.toLocaleDateString("es-AR", { month: "short" }),
        ingresos,
        egresos,
        balance: ingresos - egresos,
      });
    }
    return meses;
  };

  const formatMonto = (monto) => {
    return monto.toLocaleString("es-AR", { minimumFractionDigits: 0 });
  };

  const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div className="card">
      {/* Header */}
      <div
        className={`-mx-6 -mt-6 px-6 py-4 bg-gradient-to-r ${colors.header} text-white rounded-t-xl mb-4`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span>📅</span>
            Calendario de Contabilidad
          </h3>
          <button
            onClick={irAHoy}
            className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
          >
            Hoy
          </button>
        </div>
      </div>

      {/* Selector de Vista */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { key: "diaria", label: "📆 Diaria" },
          { key: "semanal", label: "📊 Semanal" },
          { key: "mensual", label: "🗓️ Mensual" },
          { key: "anual", label: "📈 Anual" },
        ].map((v) => (
          <button
            key={v.key}
            onClick={() => setVista(v.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              vista === v.key
                ? `${colors.button} text-white shadow-md`
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Navegación de Período */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={navegarAnterior}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h4 className="text-lg font-semibold text-gray-800 capitalize">
          {getTituloPeriodo()}
        </h4>
        <button
          onClick={navegarSiguiente}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Resumen del Período */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <p className="text-xs text-green-600 font-medium">Ingresos</p>
          <p className="text-lg font-bold text-green-700">
            ${formatMonto(totales.ingresos)}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <p className="text-xs text-red-600 font-medium">Egresos</p>
          <p className="text-lg font-bold text-red-700">
            ${formatMonto(totales.egresos)}
          </p>
        </div>
        <div
          className={`rounded-lg p-3 text-center border ${
            totales.balance >= 0
              ? "bg-blue-50 border-blue-200"
              : "bg-orange-50 border-orange-200"
          }`}
        >
          <p
            className={`text-xs font-medium ${totales.balance >= 0 ? "text-blue-600" : "text-orange-600"}`}
          >
            Balance
          </p>
          <p
            className={`text-lg font-bold ${totales.balance >= 0 ? "text-blue-700" : "text-orange-700"}`}
          >
            {totales.balance >= 0 ? "+" : ""}${formatMonto(totales.balance)}
          </p>
        </div>
      </div>

      {/* Vista Diaria */}
      {vista === "diaria" && (
        <div>
          {movimientosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-gray-500">No hay movimientos este día</p>
            </div>
          ) : (
            <div className="space-y-2">
              {movimientosFiltrados.map((mov, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border-l-4 ${
                    mov.tipo === "ingreso"
                      ? "bg-green-50 border-green-500"
                      : "bg-red-50 border-red-500"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">
                        {mov.concepto || mov.categoria || "Movimiento"}
                      </p>
                      {mov.descripcion && (
                        <p className="text-sm text-gray-500">
                          {mov.descripcion}
                        </p>
                      )}
                    </div>
                    <span
                      className={`font-bold ${mov.tipo === "ingreso" ? "text-green-600" : "text-red-600"}`}
                    >
                      {mov.tipo === "ingreso" ? "+" : "-"}$
                      {formatMonto(mov.monto)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vista Semanal */}
      {vista === "semanal" && (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-2 min-w-[500px]">
            {getDiasSemana().map((dia, idx) => {
              const esHoy =
                dia.fecha.toDateString() === new Date().toDateString();
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg text-center transition-all ${
                    esHoy
                      ? `ring-2 ${colors.ring} bg-gray-50`
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <p className="text-xs font-medium text-gray-500 uppercase">
                    {dia.nombre}
                  </p>
                  <p
                    className={`text-lg font-bold ${esHoy ? "text-gray-900" : "text-gray-700"}`}
                  >
                    {dia.fecha.getDate()}
                  </p>
                  <div className="mt-2 space-y-1">
                    {dia.ingresos > 0 && (
                      <p className="text-xs text-green-600 font-medium">
                        +${formatMonto(dia.ingresos)}
                      </p>
                    )}
                    {dia.egresos > 0 && (
                      <p className="text-xs text-red-600 font-medium">
                        -${formatMonto(dia.egresos)}
                      </p>
                    )}
                    {dia.total === 0 && (
                      <p className="text-xs text-gray-400">-</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vista Mensual - Calendario */}
      {vista === "mensual" && (
        <div>
          {/* Cabecera de días */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {diasSemana.map((dia) => (
              <div
                key={dia}
                className="text-center text-xs font-medium text-gray-500 py-2"
              >
                {dia}
              </div>
            ))}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-1">
            {getDiasDelMes().map((dia, idx) => {
              const totalesDia = getTotalesDia(dia.fecha);
              const esHoy =
                dia.fecha.toDateString() === new Date().toDateString();
              const tieneMovimientos = totalesDia.total > 0;

              return (
                <div
                  key={idx}
                  className={`min-h-[70px] p-1 rounded-lg text-center transition-all ${
                    !dia.esMesActual
                      ? "bg-gray-50 text-gray-400"
                      : esHoy
                        ? `ring-2 ${colors.ring} bg-white`
                        : tieneMovimientos
                          ? "bg-white hover:bg-gray-50 cursor-pointer"
                          : "bg-white"
                  }`}
                  title={
                    tieneMovimientos ? `${totalesDia.total} movimiento(s)` : ""
                  }
                >
                  <span
                    className={`text-sm font-medium ${esHoy ? "text-gray-900" : ""}`}
                  >
                    {dia.fecha.getDate()}
                  </span>
                  {tieneMovimientos && dia.esMesActual && (
                    <div className="mt-1 space-y-0.5">
                      {totalesDia.ingresos > 0 && (
                        <div className="text-[10px] text-green-600 font-medium truncate">
                          +$
                          {totalesDia.ingresos > 999
                            ? Math.round(totalesDia.ingresos / 1000) + "k"
                            : totalesDia.ingresos}
                        </div>
                      )}
                      {totalesDia.egresos > 0 && (
                        <div className="text-[10px] text-red-600 font-medium truncate">
                          -$
                          {totalesDia.egresos > 999
                            ? Math.round(totalesDia.egresos / 1000) + "k"
                            : totalesDia.egresos}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Vista Anual */}
      {vista === "anual" && (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {getMesesAno().map((mes) => {
            const tieneMovimientos = mes.ingresos > 0 || mes.egresos > 0;
            const esMesActual =
              mes.mes === new Date().getMonth() &&
              fechaActual.getFullYear() === new Date().getFullYear();

            return (
              <div
                key={mes.mes}
                className={`p-3 rounded-lg text-center transition-all ${
                  esMesActual
                    ? `ring-2 ${colors.ring} bg-gray-50`
                    : tieneMovimientos
                      ? "bg-gray-50 hover:bg-gray-100"
                      : "bg-gray-50"
                }`}
              >
                <p className="text-sm font-semibold text-gray-700 uppercase mb-2">
                  {mes.nombre}
                </p>
                {tieneMovimientos ? (
                  <div className="space-y-1">
                    <p className="text-xs text-green-600">
                      +${formatMonto(mes.ingresos)}
                    </p>
                    <p className="text-xs text-red-600">
                      -${formatMonto(mes.egresos)}
                    </p>
                    <p
                      className={`text-sm font-bold ${mes.balance >= 0 ? "text-blue-600" : "text-orange-600"}`}
                    >
                      {mes.balance >= 0 ? "+" : ""}${formatMonto(mes.balance)}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">Sin movimientos</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Leyenda */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Ingresos</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Egresos</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-full ring-2 ${colors.ring}`}></div>
            <span>Hoy / Actual</span>
          </div>
        </div>
      </div>
    </div>
  );
}
