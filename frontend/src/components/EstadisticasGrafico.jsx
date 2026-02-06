import { useMemo } from "react";

// Colores para las categorías (definido fuera del componente para evitar recreación)
const coloresCategorias = {
  ventas: "#22c55e",
  compras: "#ef4444",
  pedidos: "#f97316",
  cobranzas: "#3b82f6",
  logistica: "#eab308",
  servicios: "#a855f7",
  otros: "#6b7280",
};

const nombresCategorias = {
  ventas: "Ventas",
  compras: "Compras",
  pedidos: "Pedidos",
  cobranzas: "Cobranzas",
  logistica: "Logística",
  servicios: "Servicios",
  otros: "Otros",
};

/**
 * Componente de gráficos de estadísticas para contabilidad
 * Muestra gráfico de barras de ingresos/egresos por período y gráfico circular de categorías
 */
export default function EstadisticasGrafico({
  movimientos = [],
  titulo = "Estadísticas",
}) {
  // Calcular datos por los últimos 7 días
  const datosPorDia = useMemo(() => {
    const hoy = new Date();
    const dias = [];

    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - i);
      const fechaStr = fecha.toLocaleDateString("sv-SE"); // YYYY-MM-DD

      const movimientosDia = movimientos.filter((m) => m.fecha === fechaStr);
      const ingresos = movimientosDia
        .filter((m) => m.tipo === "ingreso")
        .reduce((sum, m) => sum + parseFloat(m.monto || 0), 0);
      const egresos = movimientosDia
        .filter((m) => m.tipo === "egreso")
        .reduce((sum, m) => sum + parseFloat(m.monto || 0), 0);

      dias.push({
        fecha: fechaStr,
        label: fecha.toLocaleDateString("es-AR", {
          weekday: "short",
          day: "numeric",
        }),
        ingresos,
        egresos,
      });
    }

    return dias;
  }, [movimientos]);

  // Calcular datos por categoría
  const datosPorCategoria = useMemo(() => {
    const categorias = {};

    movimientos.forEach((m) => {
      const cat = m.categoria || "otros";
      if (!categorias[cat]) {
        categorias[cat] = { ingresos: 0, egresos: 0 };
      }
      if (m.tipo === "ingreso") {
        categorias[cat].ingresos += parseFloat(m.monto || 0);
      } else {
        categorias[cat].egresos += parseFloat(m.monto || 0);
      }
    });

    return Object.entries(categorias)
      .map(([nombre, datos]) => ({
        nombre,
        ingresos: datos.ingresos,
        egresos: datos.egresos,
        total: datos.ingresos + datos.egresos,
      }))
      .sort((a, b) => b.total - a.total);
  }, [movimientos]);

  // Calcular máximo para escala del gráfico de barras
  const maxValor = useMemo(() => {
    let max = 0;
    datosPorDia.forEach((d) => {
      if (d.ingresos > max) max = d.ingresos;
      if (d.egresos > max) max = d.egresos;
    });
    return max || 1; // Evitar división por cero
  }, [datosPorDia]);

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  // Totales generales
  const totales = useMemo(() => {
    const ingresos = movimientos
      .filter((m) => m.tipo === "ingreso")
      .reduce((sum, m) => sum + parseFloat(m.monto || 0), 0);
    const egresos = movimientos
      .filter((m) => m.tipo === "egreso")
      .reduce((sum, m) => sum + parseFloat(m.monto || 0), 0);
    return {
      ingresos,
      egresos,
      balance: ingresos - egresos,
    };
  }, [movimientos]);

  // Total para gráfico circular
  const totalCategoria = datosPorCategoria.reduce((sum, c) => sum + c.total, 0);

  // Calcular ángulos para el gráfico circular
  const segmentosCirculo = useMemo(() => {
    let acumulado = 0;
    return datosPorCategoria.map((cat) => {
      const porcentaje =
        totalCategoria > 0 ? (cat.total / totalCategoria) * 100 : 0;
      const inicio = acumulado;
      acumulado += porcentaje;
      return {
        ...cat,
        porcentaje,
        inicio,
        fin: acumulado,
        color: coloresCategorias[cat.nombre] || "#6b7280",
      };
    });
  }, [datosPorCategoria, totalCategoria]);

  return (
    <div className="space-y-6">
      {/* Título */}
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
        📊 {titulo}
      </h3>

      {/* Resumen rápido */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
          <p className="text-xs text-green-600 dark:text-green-400">Ingresos</p>
          <p className="text-lg font-bold text-green-700 dark:text-green-300">
            ${formatNumber(totales.ingresos)}
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
          <p className="text-xs text-red-600 dark:text-red-400">Egresos</p>
          <p className="text-lg font-bold text-red-700 dark:text-red-300">
            ${formatNumber(totales.egresos)}
          </p>
        </div>
        <div
          className={`rounded-lg p-3 text-center ${
            totales.balance >= 0
              ? "bg-blue-50 dark:bg-blue-900/20"
              : "bg-orange-50 dark:bg-orange-900/20"
          }`}
        >
          <p
            className={`text-xs ${
              totales.balance >= 0
                ? "text-blue-600 dark:text-blue-400"
                : "text-orange-600 dark:text-orange-400"
            }`}
          >
            Balance
          </p>
          <p
            className={`text-lg font-bold ${
              totales.balance >= 0
                ? "text-blue-700 dark:text-blue-300"
                : "text-orange-700 dark:text-orange-300"
            }`}
          >
            ${formatNumber(totales.balance)}
          </p>
        </div>
      </div>

      {/* Gráfico de barras - Últimos 7 días */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
          📅 Últimos 7 días
        </h4>

        {movimientos.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No hay movimientos registrados</p>
          </div>
        ) : (
          <div className="flex items-end justify-between gap-2 h-40">
            {datosPorDia.map((dia, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center gap-1"
              >
                {/* Barras */}
                <div className="w-full flex gap-0.5 items-end h-28">
                  {/* Barra de ingresos */}
                  <div
                    className="flex-1 bg-green-500 dark:bg-green-400 rounded-t transition-all duration-300"
                    style={{
                      height: `${(dia.ingresos / maxValor) * 100}%`,
                      minHeight: dia.ingresos > 0 ? "4px" : "0",
                    }}
                    title={`Ingresos: $${dia.ingresos.toLocaleString()}`}
                  />
                  {/* Barra de egresos */}
                  <div
                    className="flex-1 bg-red-500 dark:bg-red-400 rounded-t transition-all duration-300"
                    style={{
                      height: `${(dia.egresos / maxValor) * 100}%`,
                      minHeight: dia.egresos > 0 ? "4px" : "0",
                    }}
                    title={`Egresos: $${dia.egresos.toLocaleString()}`}
                  />
                </div>
                {/* Etiqueta del día */}
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {dia.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Leyenda */}
        <div className="flex justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span className="text-gray-600 dark:text-gray-400">Ingresos</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span className="text-gray-600 dark:text-gray-400">Egresos</span>
          </div>
        </div>
      </div>

      {/* Gráfico por categorías */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
          📁 Por categoría
        </h4>

        {datosPorCategoria.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No hay datos por categoría</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Gráfico circular SVG */}
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                {segmentosCirculo.map((seg, i) => {
                  const radio = 40;
                  const circunferencia = 2 * Math.PI * radio;
                  const offset = (seg.inicio / 100) * circunferencia;
                  const longitud = (seg.porcentaje / 100) * circunferencia;

                  return (
                    <circle
                      key={i}
                      cx="50"
                      cy="50"
                      r={radio}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="20"
                      strokeDasharray={`${longitud} ${circunferencia - longitud}`}
                      strokeDashoffset={-offset}
                      className="transition-all duration-500"
                    />
                  );
                })}
              </svg>
              {/* Centro con total */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  ${formatNumber(totalCategoria)}
                </span>
              </div>
            </div>

            {/* Lista de categorías */}
            <div className="flex-1 space-y-2">
              {segmentosCirculo.slice(0, 5).map((cat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                    {nombresCategorias[cat.nombre] || cat.nombre}
                  </span>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    ${formatNumber(cat.total)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    ({cat.porcentaje.toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tendencia */}
      {movimientos.length >= 2 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            📈 Tendencia
          </h4>
          {(() => {
            // Comparar primera y segunda mitad de los datos
            const mitad = Math.floor(datosPorDia.length / 2);
            const primeraMitad = datosPorDia.slice(0, mitad);
            const segundaMitad = datosPorDia.slice(mitad);

            const ingresosPrimera = primeraMitad.reduce(
              (s, d) => s + d.ingresos,
              0,
            );
            const ingresosSegunda = segundaMitad.reduce(
              (s, d) => s + d.ingresos,
              0,
            );
            const egresosPrimera = primeraMitad.reduce(
              (s, d) => s + d.egresos,
              0,
            );
            const egresosSegunda = segundaMitad.reduce(
              (s, d) => s + d.egresos,
              0,
            );

            const cambioIngresos =
              ingresosPrimera > 0
                ? (
                    ((ingresosSegunda - ingresosPrimera) / ingresosPrimera) *
                    100
                  ).toFixed(0)
                : ingresosSegunda > 0
                  ? 100
                  : 0;
            const cambioEgresos =
              egresosPrimera > 0
                ? (
                    ((egresosSegunda - egresosPrimera) / egresosPrimera) *
                    100
                  ).toFixed(0)
                : egresosSegunda > 0
                  ? 100
                  : 0;

            return (
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-gray-600 dark:text-gray-400">
                    Ingresos:
                  </span>
                  <span
                    className={`font-medium ${
                      cambioIngresos > 0
                        ? "text-green-600"
                        : cambioIngresos < 0
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {cambioIngresos > 0 ? "↑" : cambioIngresos < 0 ? "↓" : "→"}{" "}
                    {Math.abs(cambioIngresos)}%
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-600 dark:text-gray-400">
                    Egresos:
                  </span>
                  <span
                    className={`font-medium ${
                      cambioEgresos > 0
                        ? "text-red-600"
                        : cambioEgresos < 0
                          ? "text-green-600"
                          : "text-gray-600"
                    }`}
                  >
                    {cambioEgresos > 0 ? "↑" : cambioEgresos < 0 ? "↓" : "→"}{" "}
                    {Math.abs(cambioEgresos)}%
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
