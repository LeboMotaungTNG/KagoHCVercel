import mongoose, { Types } from 'mongoose';
import { PayrollSettingsModel, IPayrollSettings } from '../models/payroll-settings.model';
import { AppError } from '../../../core/errors/AppError';

const DEFAULT_SETTINGS = {
  frequency: 'Monthly',
  pay_day: 25,
  currency: 'ZAR',
  tax_year: new Date().getFullYear().toString(),
  overtime_rate: 1.5,
  weekend_rate: 2.0,
  holiday_rate: 2.5,
  uif_enabled: true,
  uif_rate: 1,
  sdl_enabled: true,
  sdl_rate: 1,
  paye_enabled: true,
  auto_generate_payslips: true,
  allow_self_service_payslips: true
};

export class PayrollSettingsService {
  
  async getSettings(): Promise<IPayrollSettings> {
    let settings = await PayrollSettingsModel.findOne().sort({ updatedAt: -1 });
    
    // If no settings exist, create default
    if (!settings) {
      settings = await PayrollSettingsModel.create({
        ...DEFAULT_SETTINGS,
        created_by: new Types.ObjectId(), // System user
        updated_by: new Types.ObjectId()
      });
    }
    
    return settings;
  }
  
  async updateSettings(data: Partial<IPayrollSettings>, userId: string): Promise<IPayrollSettings> {
    let settings = await PayrollSettingsModel.findOne().sort({ updatedAt: -1 });
    
    if (settings) {
      // Update existing settings
      Object.assign(settings, data, { 
        updated_by: new Types.ObjectId(userId) 
      });
      await settings.save();
    } else {
      // Create new settings
      settings = await PayrollSettingsModel.create({
        ...DEFAULT_SETTINGS,
        ...data,
        created_by: new Types.ObjectId(userId),
        updated_by: new Types.ObjectId(userId)
      });
    }
    
    return settings;
  }
  
  async resetToDefaults(userId: string): Promise<IPayrollSettings> {
    return this.updateSettings(DEFAULT_SETTINGS as any, userId);
  }
  
  // Get settings formatted for frontend
  async getFormattedSettings(): Promise<any> {
    const settings = await this.getSettings();
    
    return {
      frequency: settings.frequency,
      payDay: settings.pay_day,
      currency: settings.currency,
      taxYear: settings.tax_year,
      overtimeRate: settings.overtime_rate,
      weekendRate: settings.weekend_rate,
      holidayRate: settings.holiday_rate,
      uifEnabled: settings.uif_enabled,
      uifRate: settings.uif_rate,
      sdlEnabled: settings.sdl_enabled,
      sdlRate: settings.sdl_rate,
      payeEnabled: settings.paye_enabled,
      autoGeneratePayslips: settings.auto_generate_payslips,
      allowSelfServicePayslips: settings.allow_self_service_payslips
    };
  }
}
