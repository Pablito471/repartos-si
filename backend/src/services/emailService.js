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

// Plantilla base de email elegante
const getBaseTemplate = (contenido, titulo, accentColor = "#6366f1") => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%); padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Logo flotante -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="padding-bottom: 20px;">
              <div style="width: 70px; height: 70px; background: linear-gradient(135deg, ${accentColor} 0%, #4f46e5 100%); border-radius: 16px; display: inline-block; box-shadow: 0 10px 40px rgba(99, 102, 241, 0.3);">
                <table role="presentation" width="100%" height="70" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center" valign="middle" style="color: #ffffff; font-size: 32px;">
                      📦
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>
        </table>
        
        <!-- Card principal -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15); overflow: hidden;">
          <!-- Header con gradiente -->
          <tr>
            <td style="background: linear-gradient(135deg, ${accentColor} 0%, #4f46e5 100%); padding: 35px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">
                Repartos SI
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.85); font-size: 14px; font-weight: 400;">
                Sistema de Gestión de Entregas
              </p>
            </td>
          </tr>
          
          <!-- Contenido -->
          <tr>
            <td style="padding: 45px 40px 40px 40px;">
              ${contenido}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 15px 0; color: #64748b; font-size: 13px; line-height: 1.6;">
                      Este es un mensaje automático de Repartos SI.<br>
                      Por favor, no responda directamente a este correo.
                    </p>
                    <div style="margin: 15px 0;">
                      <span style="display: inline-block; width: 8px; height: 8px; background-color: #e2e8f0; border-radius: 50%; margin: 0 4px;"></span>
                      <span style="display: inline-block; width: 8px; height: 8px; background-color: #cbd5e1; border-radius: 50%; margin: 0 4px;"></span>
                      <span style="display: inline-block; width: 8px; height: 8px; background-color: #e2e8f0; border-radius: 50%; margin: 0 4px;"></span>
                    </div>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                      © ${new Date().getFullYear()} Repartos SI. Todos los derechos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Texto adicional fuera del card -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="padding-top: 25px;">
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                Si tienes problemas, contacta a soporte@repartos-si.com
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

// Email de cuenta desactivada (elegante)
const enviarEmailCuentaDesactivada = async (usuario, motivo = null) => {
  const contenido = `
    <!-- Icono de estado -->
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 50%; line-height: 80px;">
        <span style="font-size: 40px;">⚠️</span>
      </div>
    </div>
    
    <h2 style="margin: 0 0 10px 0; color: #1e293b; font-size: 24px; font-weight: 700; text-align: center; letter-spacing: -0.5px;">
      Cuenta Temporalmente Suspendida
    </h2>
    
    <p style="margin: 0 0 25px 0; color: #64748b; font-size: 15px; text-align: center;">
      Tu acceso ha sido restringido por un administrador
    </p>
    
    <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; padding: 25px; margin-bottom: 25px;">
      <p style="margin: 0 0 15px 0; color: #475569; font-size: 15px; line-height: 1.7;">
        Hola <strong style="color: #1e293b;">${usuario.nombre}</strong>,
      </p>
      <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.7;">
        Te informamos que tu cuenta en <strong style="color: #6366f1;">Repartos SI</strong> ha sido desactivada temporalmente.
      </p>
    </div>
    
    ${
      motivo
        ? `
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%); border-left: 4px solid #f59e0b; padding: 20px 25px; margin-bottom: 25px; border-radius: 0 12px 12px 0;">
      <p style="margin: 0 0 8px 0; color: #92400e; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
        📋 Motivo de la suspensión
      </p>
      <p style="margin: 0; color: #78350f; font-size: 15px; line-height: 1.6;">
        ${motivo}
      </p>
    </div>
    `
        : ""
    }
    
    <div style="background-color: #fef2f2; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td width="40" valign="top">
            <span style="font-size: 20px;">🚫</span>
          </td>
          <td style="color: #991b1b; font-size: 14px; line-height: 1.6;">
            <strong>¿Qué significa esto?</strong><br>
            No podrás acceder a tu cuenta ni utilizar los servicios de la plataforma hasta que sea reactivada por un administrador.
          </td>
        </tr>
      </table>
    </div>
    
    <div style="background-color: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td width="40" valign="top">
            <span style="font-size: 20px;">💬</span>
          </td>
          <td style="color: #166534; font-size: 14px; line-height: 1.6;">
            <strong>¿Crees que es un error?</strong><br>
            Contacta con nuestro equipo de soporte para resolver cualquier duda o aclarar la situación.
          </td>
        </tr>
      </table>
    </div>
    
    <div style="text-align: center; padding-top: 10px; border-top: 1px solid #e2e8f0;">
      <p style="margin: 20px 0 0 0; color: #64748b; font-size: 14px;">
        Atentamente,<br>
        <strong style="color: #1e293b;">El equipo de Repartos SI</strong>
      </p>
    </div>
  `;

  return enviarEmail({
    to: usuario.email,
    subject: "⚠️ Cuenta suspendida temporalmente - Repartos SI",
    html: getBaseTemplate(contenido, "Cuenta Suspendida", "#f59e0b"),
  });
};

// Email de cuenta reactivada (elegante)
const enviarEmailCuentaActivada = async (usuario) => {
  const contenido = `
    <!-- Icono de éxito -->
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-radius: 50%; line-height: 80px;">
        <span style="font-size: 40px;">🎉</span>
      </div>
    </div>
    
    <h2 style="margin: 0 0 10px 0; color: #1e293b; font-size: 24px; font-weight: 700; text-align: center; letter-spacing: -0.5px;">
      ¡Bienvenido de vuelta!
    </h2>
    
    <p style="margin: 0 0 25px 0; color: #64748b; font-size: 15px; text-align: center;">
      Tu cuenta ha sido reactivada exitosamente
    </p>
    
    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 16px; padding: 25px; margin-bottom: 25px;">
      <p style="margin: 0 0 15px 0; color: #166534; font-size: 15px; line-height: 1.7;">
        Hola <strong style="color: #14532d;">${usuario.nombre}</strong>,
      </p>
      <p style="margin: 0; color: #166534; font-size: 15px; line-height: 1.7;">
        ¡Excelentes noticias! Tu cuenta en <strong>Repartos SI</strong> ha sido reactivada y ya puedes volver a utilizar todos nuestros servicios.
      </p>
    </div>
    
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
      <p style="margin: 0 0 15px 0; color: #475569; font-size: 14px; font-weight: 600;">
        ✅ Ahora puedes:
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">
            <span style="color: #10b981; margin-right: 10px;">●</span> Acceder a tu cuenta normalmente
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">
            <span style="color: #10b981; margin-right: 10px;">●</span> Gestionar tus pedidos y entregas
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px;">
            <span style="color: #10b981; margin-right: 10px;">●</span> Utilizar todas las funcionalidades
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Botón de acción -->
    <div style="text-align: center; margin: 35px 0;">
      <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/login" 
         style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 45px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3); transition: all 0.3s;">
        🚀 Iniciar Sesión Ahora
      </a>
    </div>
    
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      <p style="margin: 20px 0 0 0; color: #64748b; font-size: 14px;">
        ¡Gracias por ser parte de nuestra comunidad!<br>
        <strong style="color: #1e293b;">El equipo de Repartos SI</strong>
      </p>
    </div>
  `;

  return enviarEmail({
    to: usuario.email,
    subject: "🎉 ¡Tu cuenta ha sido reactivada! - Repartos SI",
    html: getBaseTemplate(contenido, "Cuenta Reactivada", "#10b981"),
  });
};

// Email de recuperación de contraseña (elegante)
const enviarEmailRecuperacionPassword = async (usuario, resetUrl) => {
  const contenido = `
    <!-- Icono de seguridad -->
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); border-radius: 50%; line-height: 80px;">
        <span style="font-size: 40px;">🔐</span>
      </div>
    </div>
    
    <h2 style="margin: 0 0 10px 0; color: #1e293b; font-size: 24px; font-weight: 700; text-align: center; letter-spacing: -0.5px;">
      Recupera tu Contraseña
    </h2>
    
    <p style="margin: 0 0 25px 0; color: #64748b; font-size: 15px; text-align: center;">
      Recibimos una solicitud para restablecer tu contraseña
    </p>
    
    <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 16px; padding: 25px; margin-bottom: 25px;">
      <p style="margin: 0 0 15px 0; color: #475569; font-size: 15px; line-height: 1.7;">
        Hola <strong style="color: #1e293b;">${usuario.nombre}</strong>,
      </p>
      <p style="margin: 0; color: #475569; font-size: 15px; line-height: 1.7;">
        Alguien (esperamos que tú) ha solicitado restablecer la contraseña de tu cuenta en <strong style="color: #6366f1;">Repartos SI</strong>.
      </p>
    </div>
    
    <!-- Botón principal -->
    <div style="text-align: center; margin: 35px 0;">
      <a href="${resetUrl}" 
         style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.35); letter-spacing: 0.3px;">
        🔑 Crear Nueva Contraseña
      </a>
    </div>
    
    <!-- Alerta de tiempo -->
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%); border-radius: 12px; padding: 20px; margin-bottom: 25px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td width="45" valign="top">
            <span style="font-size: 24px;">⏱️</span>
          </td>
          <td style="color: #92400e; font-size: 14px; line-height: 1.6;">
            <strong>Tiempo limitado</strong><br>
            Este enlace expirará en <strong>1 hora</strong> por seguridad.
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Nota de seguridad -->
    <div style="background-color: #fef2f2; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td width="45" valign="top">
            <span style="font-size: 24px;">🛡️</span>
          </td>
          <td style="color: #991b1b; font-size: 14px; line-height: 1.6;">
            <strong>¿No fuiste tú?</strong><br>
            Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña actual seguirá siendo válida.
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Enlace alternativo -->
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
      <p style="margin: 0 0 10px 0; color: #64748b; font-size: 13px;">
        📎 Si el botón no funciona, copia y pega este enlace en tu navegador:
      </p>
      <p style="margin: 0; padding: 12px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0;">
        <a href="${resetUrl}" style="color: #6366f1; font-size: 12px; word-break: break-all; text-decoration: none;">
          ${resetUrl}
        </a>
      </p>
    </div>
    
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      <p style="margin: 20px 0 0 0; color: #64748b; font-size: 14px;">
        Mantén tu cuenta segura,<br>
        <strong style="color: #1e293b;">El equipo de Repartos SI</strong>
      </p>
    </div>
  `;

  return enviarEmail({
    to: usuario.email,
    subject: "🔐 Recupera tu contraseña - Repartos SI",
    html: getBaseTemplate(contenido, "Recuperar Contraseña", "#6366f1"),
  });
};

// Email de bienvenida con verificación de cuenta (elegante)
const enviarEmailBienvenida = async (usuario, verificationUrl) => {
  const tipoLabels = {
    cliente: "Cliente",
    deposito: "Depósito",
    flete: "Transportista",
    admin: "Administrador",
  };

  const contenido = `
    <!-- Icono de bienvenida -->
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; width: 90px; height: 90px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 50%; line-height: 90px;">
        <span style="font-size: 45px;">🎊</span>
      </div>
    </div>
    
    <h2 style="margin: 0 0 10px 0; color: #1e293b; font-size: 26px; font-weight: 700; text-align: center; letter-spacing: -0.5px;">
      ¡Bienvenido a Repartos SI!
    </h2>
    
    <p style="margin: 0 0 25px 0; color: #64748b; font-size: 15px; text-align: center;">
      Tu cuenta ha sido creada exitosamente
    </p>
    
    <!-- Card de información del usuario -->
    <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 16px; padding: 25px; margin-bottom: 25px; border: 1px solid #bae6fd;">
      <p style="margin: 0 0 15px 0; color: #0369a1; font-size: 15px; line-height: 1.7;">
        Hola <strong style="color: #0c4a6e;">${usuario.nombre}</strong>,
      </p>
      <p style="margin: 0; color: #0369a1; font-size: 15px; line-height: 1.7;">
        ¡Gracias por unirte a <strong>Repartos SI</strong>! Estamos emocionados de tenerte como parte de nuestra comunidad.
      </p>
    </div>
    
    <!-- Detalles de la cuenta -->
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
      <p style="margin: 0 0 15px 0; color: #475569; font-size: 14px; font-weight: 600;">
        📋 Detalles de tu cuenta:
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="color: #64748b; font-size: 14px;" width="40%">Tipo de cuenta:</td>
                <td style="color: #1e293b; font-size: 14px; font-weight: 600;">${tipoLabels[usuario.tipoUsuario] || usuario.tipoUsuario}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="color: #64748b; font-size: 14px;" width="40%">Email:</td>
                <td style="color: #1e293b; font-size: 14px; font-weight: 600;">${usuario.email}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="color: #64748b; font-size: 14px;" width="40%">Estado:</td>
                <td style="color: #f59e0b; font-size: 14px; font-weight: 600;">⏳ Pendiente de verificación</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Mensaje de verificación -->
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%); border-radius: 12px; padding: 20px; margin-bottom: 25px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td width="45" valign="top">
            <span style="font-size: 24px;">✉️</span>
          </td>
          <td style="color: #92400e; font-size: 14px; line-height: 1.6;">
            <strong>Verifica tu cuenta</strong><br>
            Para acceder a todas las funcionalidades, confirma tu dirección de correo electrónico.
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Botón principal de verificación -->
    <div style="text-align: center; margin: 35px 0;">
      <a href="${verificationUrl}" 
         style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 30px rgba(34, 197, 94, 0.35); letter-spacing: 0.3px;">
        ✅ Verificar mi Cuenta
      </a>
    </div>
    
    <!-- Tiempo de expiración -->
    <div style="text-align: center; margin-bottom: 25px;">
      <p style="margin: 0; color: #64748b; font-size: 13px;">
        ⏱️ Este enlace expirará en <strong>24 horas</strong>
      </p>
    </div>
    
    <!-- Qué puedes hacer -->
    <div style="background-color: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
      <p style="margin: 0 0 15px 0; color: #166534; font-size: 14px; font-weight: 600;">
        🚀 Una vez verificado podrás:
      </p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
          <td style="padding: 6px 0; color: #15803d; font-size: 14px;">
            <span style="color: #22c55e; margin-right: 10px;">✓</span> Acceder a tu panel personalizado
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #15803d; font-size: 14px;">
            <span style="color: #22c55e; margin-right: 10px;">✓</span> Gestionar pedidos y entregas
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #15803d; font-size: 14px;">
            <span style="color: #22c55e; margin-right: 10px;">✓</span> Conectar con clientes, depósitos y transportistas
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #15803d; font-size: 14px;">
            <span style="color: #22c55e; margin-right: 10px;">✓</span> Recibir notificaciones en tiempo real
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Enlace alternativo -->
    <div style="background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
      <p style="margin: 0 0 10px 0; color: #64748b; font-size: 13px;">
        📎 Si el botón no funciona, copia y pega este enlace:
      </p>
      <p style="margin: 0; padding: 12px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0;">
        <a href="${verificationUrl}" style="color: #22c55e; font-size: 12px; word-break: break-all; text-decoration: none;">
          ${verificationUrl}
        </a>
      </p>
    </div>
    
    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      <p style="margin: 20px 0 0 0; color: #64748b; font-size: 14px;">
        ¡Bienvenido a bordo! 🎉<br>
        <strong style="color: #1e293b;">El equipo de Repartos SI</strong>
      </p>
    </div>
  `;

  return enviarEmail({
    to: usuario.email,
    subject: "🎊 ¡Bienvenido a Repartos SI! Verifica tu cuenta",
    html: getBaseTemplate(contenido, "Bienvenida", "#22c55e"),
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
  enviarEmailRecuperacionPassword,
  enviarEmailBienvenida,
};
