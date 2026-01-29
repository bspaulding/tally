import cron from 'node-cron';
import { syncTransactions } from './plaid';

export function startScheduler() {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    console.log('Running scheduled transaction sync...');
    try {
      await syncTransactions();
      console.log('Scheduled sync completed');
    } catch (error) {
      console.error('Error during scheduled sync:', error);
    }
  });

  console.log('Scheduler started - syncing transactions every hour');
}
