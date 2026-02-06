const nodemailer = require("nodemailer");

// Configurar transporter
const createTransporter = () => {
  // En producción usar SMTP real (Gmail, SendGrid, etc.)
  // En desarrollo usar Ethereal (fake SMTP) o variables de entorno
  if (process.env.EMAIL_HOST) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Para Gmail (necesita App Password)
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  console.log(
    "⚠️ Email service en modo desarrollo (no se envían emails reales)",
  );
  return null;
};

const transporter = createTransporter();

// Plantilla base de email
const getBaseTemplate = (contenido, titulo) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                📦 Repartos SI
              </h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              ${contenido}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 25px 30px; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 13px;">
                Este es un mensaje automático de Repartos SI.<br>
                Por favor, no responda a este correo.
              </p>
              <p style="margin: 15px 0 0 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Repartos SI. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Email de cuenta desactivada
const enviarEmailCuentaDesactivada = async (usuario, motivo = null) => {
  const contenido = `
    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 22px;">
      Cuenta Desactivada
    </h2>
    <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
      Hola <strong>${usuario.nombre}</strong>,
    </p>
    <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
      Te informamos que tu cuenta en <strong>Repartos SI</strong> ha sido desactivada por un administrador.
    </p>
    ${
      motivo
        ? `
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: #92400e; font-size: 14px;">
        <strong>Motivo:</strong> ${motivo}
      </p>
    </div>
    `
        : ""
    }
    <p style="margin: 20px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
      Esto significa que ya no podrás acceder a tu cuenta ni utilizar los servicios de la plataforma hasta que sea reactivada.
    </p>
    <p style="margin: 20px 0 0 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
      Si crees que esto es un error o deseas más información, por favor contacta con nuestro equipo de soporte.
    </p>
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #6b7280; font-size: 14px;">
        Saludos,<br>
        <strong>El equipo de Repartos SI</strong>
      </p>
    </div>
  `;

  return enviarEmail({
    to: usuario.email,
    subject: "⚠️ Tu cuenta ha sido desactivada - Repartos SI",
    html: getBaseTemplate(contenido, "Cuenta Desactivada"),
  });
};

// Email de cuenta reactivada
const enviarEmailCuentaActivada = async (usuario) => {
  const contenido = `
    <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 22px;">
      ¡Tu cuenta ha sido reactivada!
    </h2>
    <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
      Hola <strong>${usuario.nombre}</strong>,
    </p>
    <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
      ¡Buenas noticias! Tu cuenta en <strong>Repartos SI</strong> ha sido reactivada.
    </p>
    <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; color: #065f46; font-size: 14px;">
        ✅ Ya puedes volver a acceder a tu cuenta y utilizar todos los servicios de la plataforma.
      </p>
    </div>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/login" 
         style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Iniciar Sesión
      </a>
    </div>
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #6b7280; font-size: 14px;">
        Saludos,<br>
        <strong>El equipo de Repartos SI</strong>
      </p>
    </div>
  `;

  return enviarEmail({
    to: usuario.email,
    subject: "✅ Tu cuenta ha sido reactivada - Repartos SI",
    html: getBaseTemplate(contenido, "Cuenta Reactivada"),
  });
};

// Función genérica para enviar emails
const enviarEmail = async ({ to, subject, html, text }) => {
  try {
    if (!transporter) {
      console.log(
        "   (Configura variables de entorno para enviar emails reales)\n",
      );
      return { success: true, simulated: true };
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Repartos SI" <noreply@repartos-si.com>',
      to,
      subject,
      html,
      text: text || subject,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error enviando email a ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  enviarEmail,
  enviarEmailCuentaDesactivada,
  enviarEmailCuentaActivada,
};
