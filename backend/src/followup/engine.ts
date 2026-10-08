// Motor de seguimiento automático
import { prisma } from '../prisma/client';
import { io } from '../index';

const FOLLOWUP_MESSAGES = [
  (name: string | null, product: string | null) =>
    `¡Hola${name ? ` ${name}` : ''}! 👋 Te escribimos de Juegos del Siglo XXI. ` +
    `Quedamos en contacto sobre ${product ? `"${product}"` : 'nuestros productos'}. ` +
    `¿Pudiste avanzar con tu consulta? Estamos para ayudarte.`,
  (name: string | null, product: string | null) =>
    `${name ? `${name}, ` : ''}te volvemos a escribir de Juegos del Siglo XXI. ` +
    `${product ? `Muchos clientes que consultaron por "${product}" quedaron muy conformes. ` : ''}` +
    `¿Te puedo dar más información para ayudarte a decidir?`,
  (name: string | null, _product: string | null) =>
    `¡Último mensaje de Juegos del Siglo XXI! 🎪 ` +
    `${name ? `${name}, no` : 'No'} queremos molestarte más, pero si necesitás juegos infantiles o peloteros, acá estamos. ¡Éxitos! 😊`,
];

const FOLLOWUP_DELAYS_MINUTES = [240, 1440, 2880];
const BUSINESS_HOURS = { start: 9, end: 20 };

function isBusinessHour(): boolean {
  const now = new Date();
  const argHour = (now.getUTCHours() - 3 + 24) % 24;
  return argHour >= BUSINESS_HOURS.start && argHour < BUSINESS_HOURS.end;
}

export async function runFollowUpCycle(): Promise<void> {
  console.log('[FollowUp] Iniciando ciclo...');
  if (!isBusinessHour()) {
    console.log('[FollowUp] Fuera de horario comercial.');
    return;
  }
  await sendPendingFollowUps();
  await scheduleNewFollowUps();
  console.log('[FollowUp] Ciclo completado.');
}

async function sendPendingFollowUps(): Promise<void> {
  const now = new Date();
  const pending = await prisma.followUp.findMany({
    where: { status: 'PENDING', scheduledAt: { lte: now } },
    include: {
      lead: {
        select: {
          id: true, tenantId: true, name: true, status: true,
          conversations: { orderBy: { createdAt: 'desc' }, take: 1, select: { id: true } },
        },
      },
    },
  });

  for (const followUp of pending) {
    if (['CONVERTED', 'CLOSED', 'LOST', 'ASSIGNED'].includes(followUp.lead.status)) {
      await prisma.followUp.update({ where: { id: followUp.id }, data: { status: 'CANCELLED' } });
      continue;
    }
    await prisma.followUp.update({ where: { id: followUp.id }, data: { status: 'SENT', sentAt: now } });
    const convId = followUp.lead.conversations[0]?.id;
    if (convId) {
      await prisma.message.create({
        data: { conversationId: convId, role: 'ASSISTANT', content: followUp.message, intentDetected: 'followup' },
      });
    }
    await prisma.lead.update({ where: { id: followUp.lead.id }, data: { status: 'FOLLOWUP' } });
    io.emit('followup:sent', { leadId: followUp.lead.id, tenantId: followUp.lead.tenantId, attempt: followUp.attempt });
    console.log(`[FollowUp] Enviado intento ${followUp.attempt} para lead ${followUp.lead.id}`);
  }
}

async function scheduleNewFollowUps(): Promise<void> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - FOLLOWUP_DELAYS_MINUTES[0] * 60 * 1000);
  const leads = await prisma.lead.findMany({
    where: {
      temperature: { in: ['WARM', 'HOT'] },
      status: { in: ['NEW', 'IN_PROGRESS'] },
      updatedAt: { lte: cutoff },
      followUps: { none: {} },
    },
    select: { id: true, name: true, product: true, tenantId: true },
    take: 50,
  });

  for (const lead of leads) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const delayMs = FOLLOWUP_DELAYS_MINUTES[attempt - 1] * 60 * 1000;
      await prisma.followUp.create({
        data: {
          leadId: lead.id,
          scheduledAt: new Date(now.getTime() + delayMs),
          message: FOLLOWUP_MESSAGES[attempt - 1](lead.name, lead.product),
          attempt,
          status: 'PENDING',
        },
      });
    }
    console.log(`[FollowUp] 3 seguimientos programados para lead ${lead.id}`);
  }
}

export async function cancelFollowUps(leadId: string): Promise<void> {
  await prisma.followUp.updateMany({ where: { leadId, status: 'PENDING' }, data: { status: 'CANCELLED' } });
}
