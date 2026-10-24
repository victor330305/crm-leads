// Servicio de notificaciones por email
// Usa Resend para enviar alertas al vendedor cuando hay un lead caliente

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface LeadNotificationData {
  tenantName: string;
  leadName: string | null;
  leadPhone: string | null;
  leadCity: string | null;
  product: string | null;
  score: number;
  summary: string;
  conversationId: string;
  dashboardUrl?: string;
}

/**
 * Envía un email al vendedor cuando hay un lead caliente que necesita atención.
 */
export async function sendLeadHandoffEmail(
  toEmail: string,
  data: LeadNotificationData
): Promise<void> {
  const {
    tenantName,
    leadName,
    leadPhone,
    leadCity,
    product,
    score,
    summary,
    dashboardUrl = 'https://crm-leads-7orf.vercel.app',
  } = data;

  const scoreColor = score >= 71 ? '#ef4444' : score >= 31 ? '#f59e0b' : '#3b82f6';
  const scoreLabel = score >= 71 ? '🔥 Caliente' : score >= 31 ? '🌡️ Tibio' : '❄️ Frío';

  try {
    await resend.emails.send({
      from: 'CRM Leads <onboarding@resend.dev>',
      to: toEmail,
      subject: `🔥 Nuevo lead caliente — ${leadName ?? 'Sin nombre'} (Score: ${score})`,
      html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:#4f46e5;padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">🎯 Nuevo lead listo para vos</h1>
              <p style="margin:4px 0 0;color:#c7d2fe;font-size:14px;">${tenantName}</p>
            </td>
          </tr>

          <!-- Score badge -->
          <tr>
            <td style="padding:24px 32px 0;">
              <div style="display:inline-block;background:${scoreColor}20;border:2px solid ${scoreColor};border-radius:8px;padding:8px 16px;">
                <span style="color:${scoreColor};font-weight:700;font-size:18px;">${scoreLabel} — Score ${score}/100</span>
              </div>
            </td>
          </tr>

          <!-- Lead data -->
          <tr>
            <td style="padding:20px 32px;">
              <h2 style="margin:0 0 16px;font-size:16px;color:#1f2937;">Datos del cliente</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${leadName ? `
                <tr>
                  <td style="padding:6px 0;color:#6b7280;font-size:14px;width:120px;">Nombre</td>
                  <td style="padding:6px 0;color:#1f2937;font-size:14px;font-weight:600;">${leadName}</td>
                </tr>` : ''}
                ${leadPhone ? `
                <tr>
                  <td style="padding:6px 0;color:#6b7280;font-size:14px;">Teléfono</td>
                  <td style="padding:6px 0;color:#1f2937;font-size:14px;font-weight:600;">
                    <a href="https://wa.me/${leadPhone.replace(/\D/g, '')}" style="color:#4f46e5;">${leadPhone}</a>
                  </td>
                </tr>` : ''}
                ${leadCity ? `
                <tr>
                  <td style="padding:6px 0;color:#6b7280;font-size:14px;">Ciudad</td>
                  <td style="padding:6px 0;color:#1f2937;font-size:14px;">${leadCity}</td>
                </tr>` : ''}
                ${product ? `
                <tr>
                  <td style="padding:6px 0;color:#6b7280;font-size:14px;">Producto</td>
                  <td style="padding:6px 0;color:#1f2937;font-size:14px;">${product}</td>
                </tr>` : ''}
              </table>
            </td>
          </tr>

          <!-- Summary -->
          <tr>
            <td style="padding:0 32px 20px;">
              <div style="background:#f8f9fa;border-left:4px solid #4f46e5;border-radius:4px;padding:16px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Resumen de la conversación</p>
                <p style="margin:0;font-size:14px;color:#1f2937;line-height:1.6;">${summary}</p>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 32px 32px;">
              <a href="${dashboardUrl}/leads"
                style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
                Ver en el dashboard →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;background:#f8f9fa;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Este mensaje fue generado automáticamente por CRM Leads.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });

    console.log(`[Email] Notificación enviada a ${toEmail} para lead ${data.leadName ?? 'sin nombre'}`);
  } catch (error) {
    console.error('[Email] Error al enviar notificación:', error);
  }
}
