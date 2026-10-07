// Scheduler de seguimientos automáticos
// Usa node-cron para ejecutar el motor de seguimiento cada hora

import cron from 'node-cron';
import { runFollowUpCycle } from './engine';

/**
 * Inicia el scheduler. Se ejecuta cada hora en punto.
 * En desarrollo podés cambiar a '* * * * *' para probar cada minuto.
 */
export function startFollowUpScheduler(): void {
  // Ejecutar cada hora en punto: '0 * * * *'
  // Para probar cada minuto: '* * * * *'
  const schedule = process.env.NODE_ENV === 'development' ? '*/5 * * * *' : '0 * * * *';

  cron.schedule(schedule, async () => {
    try {
      await runFollowUpCycle();
    } catch (error) {
      console.error('[Scheduler] Error en ciclo de seguimiento:', error);
    }
  }, {
    timezone: 'America/Argentina/Buenos_Aires',
  });

  console.log(`[Scheduler] FollowUp scheduler iniciado (${schedule})`);
}
