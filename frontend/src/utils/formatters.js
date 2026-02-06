/**
 * Formatea un número como moneda (sin decimales)
 * @param {number} num - El número a formatear
 * @returns {string} - El número formateado
 */
export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return "0";
  return Math.round(num)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Formatea un número como moneda con símbolo $
 * @param {number} num - El número a formatear
 * @returns {string} - El número formateado con $
 */
export function formatCurrency(num) {
  return `$${formatNumber(num)}`;
}

/**
 * Convierte una fecha ISO UTC a fecha local en formato YYYY-MM-DD
 * Resuelve el problema de zona horaria donde split("T")[0] da la fecha UTC
 * @param {string|Date} isoDate - Fecha ISO string o Date object
 * @returns {string} - Fecha en formato YYYY-MM-DD en zona horaria local
 */
export function toLocalDateString(isoDate) {
  if (!isoDate) return new Date().toLocaleDateString("sv-SE"); // formato YYYY-MM-DD
  const d = new Date(isoDate);
  // toLocaleDateString con locale 'sv-SE' devuelve formato YYYY-MM-DD
  return d.toLocaleDateString("sv-SE");
}

/**
 * Formatea una fecha de forma consistente
 * @param {Date|string} date - La fecha a formatear
 * @returns {string} - La fecha formateada
 */
export function formatDate(date) {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formatea una fecha con hora
 * @param {Date|string} date - La fecha a formatear
 * @returns {string} - La fecha y hora formateada
 */
export function formatDateTime(date) {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Días de la semana en español
 */
export const DIAS_SEMANA = [
  { id: 0, nombre: "Domingo", abrev: "Dom" },
  { id: 1, nombre: "Lunes", abrev: "Lun" },
  { id: 2, nombre: "Martes", abrev: "Mar" },
  { id: 3, nombre: "Miércoles", abrev: "Mié" },
  { id: 4, nombre: "Jueves", abrev: "Jue" },
  { id: 5, nombre: "Viernes", abrev: "Vie" },
  { id: 6, nombre: "Sábado", abrev: "Sáb" },
];

/**
 * Verifica si la hora actual está dentro del horario de atención
 * @param {string} horaApertura - Hora de apertura en formato "HH:mm"
 * @param {string} horaCierre - Hora de cierre en formato "HH:mm"
 * @param {number[]} diasLaborales - Array con los días laborales (0=Dom, 1=Lun, etc.)
 * @returns {object} - { disponible: boolean, mensaje: string, proximaApertura: string }
 */
export function verificarDisponibilidadHorario(
  horaApertura,
  horaCierre,
  diasLaborales = [1, 2, 3, 4, 5],
) {
  const ahora = new Date();
  const diaActual = ahora.getDay(); // 0 = Domingo, 1 = Lunes, etc.
  const horaActual = ahora.getHours();
  const minutosActual = ahora.getMinutes();

  // Parsear horas
  const [horaAp, minAp] = (horaApertura || "08:00").split(":").map(Number);
  const [horaCi, minCi] = (horaCierre || "18:00").split(":").map(Number);

  // Convertir todo a minutos para comparar
  const minutosAhora = horaActual * 60 + minutosActual;
  const minutosApertura = horaAp * 60 + minAp;
  const minutosCierre = horaCi * 60 + minCi;

  // Verificar si es día laboral
  const esDiaLaboral = diasLaborales.includes(diaActual);

  if (!esDiaLaboral) {
    // Encontrar el próximo día laboral
    let proximoDia = diaActual;
    for (let i = 1; i <= 7; i++) {
      proximoDia = (diaActual + i) % 7;
      if (diasLaborales.includes(proximoDia)) break;
    }
    const nombreDia = DIAS_SEMANA[proximoDia].nombre;

    return {
      disponible: false,
      abierto: false,
      mensaje: `Cerrado hoy`,
      detalle: `Abre el ${nombreDia} a las ${horaApertura}`,
      proximaApertura: `${nombreDia} ${horaApertura}`,
    };
  }

  // Verificar si está dentro del horario
  if (minutosAhora < minutosApertura) {
    return {
      disponible: true,
      abierto: false,
      mensaje: `Abre a las ${horaApertura}`,
      detalle: `Horario: ${horaApertura} - ${horaCierre}`,
      proximaApertura: horaApertura,
    };
  }

  if (minutosAhora >= minutosApertura && minutosAhora < minutosCierre) {
    const minutosRestantes = minutosCierre - minutosAhora;
    const horasRestantes = Math.floor(minutosRestantes / 60);
    const minsRestantes = minutosRestantes % 60;

    let cierraEn = "";
    if (horasRestantes > 0) {
      cierraEn = `${horasRestantes}h ${minsRestantes}min`;
    } else {
      cierraEn = `${minsRestantes} min`;
    }

    return {
      disponible: true,
      abierto: true,
      mensaje: `Abierto ahora`,
      detalle: `Cierra en ${cierraEn}`,
      proximaApertura: null,
    };
  }

  // Ya cerró hoy, buscar próximo día laboral
  let proximoDia = diaActual;
  for (let i = 1; i <= 7; i++) {
    proximoDia = (diaActual + i) % 7;
    if (diasLaborales.includes(proximoDia)) break;
  }
  const nombreDia =
    proximoDia === (diaActual + 1) % 7
      ? "mañana"
      : DIAS_SEMANA[proximoDia].nombre;

  return {
    disponible: true,
    abierto: false,
    mensaje: `Cerrado`,
    detalle: `Abre ${nombreDia} a las ${horaApertura}`,
    proximaApertura: `${nombreDia} ${horaApertura}`,
  };
}

/**
 * Formatea los días laborales como texto
 * @param {number[]} dias - Array de días (0-6)
 * @returns {string} - Texto formateado (ej: "Lun a Vie" o "Lun, Mié, Vie")
 */
export function formatDiasLaborales(dias = []) {
  if (!dias || dias.length === 0) return "No especificado";

  // Ordenar los días
  const diasOrdenados = [...dias].sort((a, b) => a - b);

  // Verificar si son días consecutivos
  const sonConsecutivos = diasOrdenados.every((dia, i) => {
    if (i === 0) return true;
    return dia === diasOrdenados[i - 1] + 1;
  });

  if (sonConsecutivos && diasOrdenados.length > 2) {
    const primero = DIAS_SEMANA[diasOrdenados[0]].abrev;
    const ultimo = DIAS_SEMANA[diasOrdenados[diasOrdenados.length - 1]].abrev;
    return `${primero} a ${ultimo}`;
  }

  return diasOrdenados.map((d) => DIAS_SEMANA[d].abrev).join(", ");
}
