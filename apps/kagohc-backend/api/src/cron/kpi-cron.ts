import cron from 'node-cron';
import { KpiService } from '../modules/kpi/services/kpi.service';
import logger from '../core/utils/logger';

const kpiService = new KpiService();

/**
 * Initialize KPI cron jobs
 * Run every day at 1 AM to update period statuses
 */
export const initializeKpiCrons = () => {
  // Run every day at 1 AM
  cron.schedule('0 1 * * *', async () => {
    logger.info('Running daily KPI period status update...');
    
    try {
      const result = await kpiService.updatePeriodStatuses();
      logger.info(`KPI periods updated: ${result.updated} periods`);
    } catch (error) {
      logger.error('KPI period update failed:', error);
    }
  });

  logger.info('KPI cron jobs initialized');
};
