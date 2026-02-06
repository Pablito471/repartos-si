import jsPDF from "jspdf";
import QRCode from "qrcode";

/**
 * Genera un código único para el pedido
 * @param {number} pedidoId - ID del pedido
 * @param {number} clienteId - ID del cliente
 * @returns {string} Código único
 */
export const generarCodigoEntrega = (pedidoId, clienteId) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ENT-${pedidoId}-${clienteId}-${timestamp}-${random}`;
};

/**
 * Genera el PDF de entrega con QR
 * @param {Object} pedido - Datos del pedido
 * @param {Object} cliente - Datos del cliente
 * @param {Object} deposito - Datos del depósito
 * @param {string} baseUrl - URL base de la aplicación
 * @returns {Promise<{pdf: jsPDF, codigoEntrega: string}>}
 */
export const generarPDFEntrega = async (pedido, cliente, deposito, baseUrl) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  const codigoEntrega = generarCodigoEntrega(pedido.id, cliente?.id || 0);

  // URL que contendrá el QR para cargar el stock
  const qrUrl = `${baseUrl}/confirmar-entrega?codigo=${codigoEntrega}&pedido=${pedido.id}`;

  // Generar QR como data URL
  const qrDataUrl = await QRCode.toDataURL(qrUrl, {
    width: 300,
    margin: 1,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });

  // Colores
  const primaryColor = [37, 99, 235]; // Azul
  const grayColor = [107, 114, 128];
  const darkColor = [31, 41, 55];
  const lightBg = [248, 250, 252];

  // ============ HEADER ============
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("REPARTOS SI", margin, 15);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Comprobante de Entrega", margin, 23);

  // Número de pedido y fecha (derecha)
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Pedido #${pedido.id}`, pageWidth - margin, 15, { align: "right" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    new Date().toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    pageWidth - margin,
    23,
    { align: "right" },
  );

  let y = 45;

  // ============ CÓDIGO DE ENTREGA ============
  doc.setFillColor(...lightBg);
  doc.roundedRect(margin, y, contentWidth, 15, 2, 2, "F");
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(margin, y, contentWidth, 15, 2, 2, "S");

  doc.setTextColor(...grayColor);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("CÓDIGO DE ENTREGA", margin + 5, y + 6);

  doc.setTextColor(...darkColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(codigoEntrega, margin + 5, y + 12);

  y += 22;

  // ============ INFORMACIÓN EN DOS COLUMNAS ============
  const colWidth = (contentWidth - 10) / 2;

  // --- Columna Izquierda: Cliente ---
  doc.setFillColor(...lightBg);
  doc.roundedRect(margin, y, colWidth, 40, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.text("CLIENTE", margin + 5, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...darkColor);
  doc.text(cliente?.nombre || pedido.cliente || "N/A", margin + 5, y + 16);

  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  const direccionCliente = pedido.direccion || "Retiro en depósito";
  const direccionLines = doc.splitTextToSize(direccionCliente, colWidth - 10);
  doc.text(direccionLines, margin + 5, y + 24);

  doc.text(`Envío: ${formatTipoEnvio(pedido.tipoEnvio)}`, margin + 5, y + 35);

  // --- Columna Derecha: Depósito ---
  const col2X = margin + colWidth + 10;
  doc.setFillColor(...lightBg);
  doc.roundedRect(col2X, y, colWidth, 40, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.text("DEPÓSITO ORIGEN", col2X + 5, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...darkColor);
  doc.text(deposito?.nombre || pedido.deposito || "N/A", col2X + 5, y + 16);

  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  const direccionDeposito = deposito?.direccion || "N/A";
  const depLines = doc.splitTextToSize(direccionDeposito, colWidth - 10);
  doc.text(depLines, col2X + 5, y + 24);

  y += 48;

  // ============ TABLA DE PRODUCTOS ============
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text("DETALLE DE PRODUCTOS", margin, y);

  y += 6;

  // Header de tabla
  doc.setFillColor(...primaryColor);
  doc.rect(margin, y, contentWidth, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("PRODUCTO", margin + 3, y + 5.5);
  doc.text("CANT.", margin + 95, y + 5.5);
  doc.text("P. UNIT.", margin + 115, y + 5.5);
  doc.text("SUBTOTAL", margin + 145, y + 5.5, { align: "left" });

  y += 8;

  // Filas de productos (máximo visible sin desbordar)
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...darkColor);

  let total = 0;
  const maxProductos = Math.min(pedido.productos.length, 8); // Limitar para no desbordar

  pedido.productos.slice(0, maxProductos).forEach((producto, index) => {
    const subtotal = producto.cantidad * producto.precio;
    total += subtotal;

    // Alternar color de fondo
    if (index % 2 === 0) {
      doc.setFillColor(252, 252, 253);
      doc.rect(margin, y, contentWidth, 7, "F");
    }

    doc.setFontSize(8);
    doc.setTextColor(...darkColor);

    // Truncar nombre si es muy largo
    const nombreTruncado =
      producto.nombre.length > 35
        ? producto.nombre.substring(0, 35) + "..."
        : producto.nombre;

    doc.text(nombreTruncado, margin + 3, y + 5);
    doc.text(producto.cantidad.toString(), margin + 98, y + 5);
    doc.text(`$${producto.precio.toLocaleString()}`, margin + 115, y + 5);
    doc.text(`$${subtotal.toLocaleString()}`, margin + 145, y + 5);

    y += 7;
  });

  // Si hay más productos, mostrar indicador
  if (pedido.productos.length > maxProductos) {
    doc.setFontSize(7);
    doc.setTextColor(...grayColor);
    doc.text(
      `... y ${pedido.productos.length - maxProductos} producto(s) más`,
      margin + 3,
      y + 4,
    );
    y += 6;

    // Sumar los productos restantes al total
    pedido.productos.slice(maxProductos).forEach((producto) => {
      total += producto.cantidad * producto.precio;
    });
  }

  // Línea separadora
  y += 2;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin + 90, y, margin + contentWidth, y);

  // Total
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...darkColor);
  doc.text("TOTAL:", margin + 115, y);
  doc.setTextColor(...primaryColor);
  doc.text(`$${(pedido.total || total).toLocaleString()}`, margin + 145, y);

  // ============ SECCIÓN QR ============
  y += 12;

  // Caja del QR
  const qrBoxHeight = 75;
  const qrSize = 50;

  doc.setFillColor(...lightBg);
  doc.roundedRect(margin, y, contentWidth, qrBoxHeight, 3, 3, "F");
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, qrBoxHeight, 3, 3, "S");

  // Título del QR
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text("ESCANEAR PARA CONFIRMAR ENTREGA", pageWidth / 2, y + 10, {
    align: "center",
  });

  // QR Code centrado
  const qrX = (pageWidth - qrSize) / 2;
  doc.addImage(qrDataUrl, "PNG", qrX, y + 15, qrSize, qrSize);

  // Instrucciones debajo del QR
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...grayColor);
  doc.text(
    "El cliente debe escanear este código QR con su celular para confirmar la recepción",
    pageWidth / 2,
    y + qrBoxHeight - 5,
    { align: "center" },
  );

  // ============ FOOTER ============
  // Footer fijo en la parte inferior
  const footerY = pageHeight - 15;

  doc.setFillColor(...primaryColor);
  doc.rect(0, footerY, pageWidth, 15, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Comprobante válido. Al escanear el QR, los productos se agregarán automáticamente al stock del cliente.",
    pageWidth / 2,
    footerY + 6,
    { align: "center" },
  );
  doc.text(
    `Generado: ${new Date().toLocaleString("es-ES")} | Código: ${codigoEntrega}`,
    pageWidth / 2,
    footerY + 11,
    { align: "center" },
  );

  return { pdf: doc, codigoEntrega };
};

/**
 * Formatea el tipo de envío para mostrar
 */
const formatTipoEnvio = (tipo) => {
  const tipos = {
    envio: "Envío a domicilio",
    flete: "Flete",
    retiro: "Retiro en depósito",
  };
  return tipos[tipo] || tipo;
};

/**
 * Descarga el PDF
 */
export const descargarPDF = (pdf, nombreArchivo) => {
  pdf.save(nombreArchivo);
};

/**
 * Abre el PDF en una nueva pestaña
 */
export const abrirPDF = (pdf) => {
  const blob = pdf.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
};
