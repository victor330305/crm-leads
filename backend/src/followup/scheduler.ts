import cron from 'node-cron';
import { runFollowUpCycle } from './engine';

export function startFollowUpScheduler(): void {
  const schedule = process.env.NODE_ENV === 'development' ? '*/5 * * * *' : '0 * * * *';
  cron.schedule(schedule, async () => {
    try { await runFollowUpCycle(); }
    catch (error) { console.error('[Scheduler] Error:', error); }
  }, { timezone: 'America/Argentina/Buenos_Aires' });
  console.log(`[Scheduler] FollowUp scheduler iniciado (${schedule})`);
}
