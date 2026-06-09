import { Request, Response, NextFunction } from 'express';
import { PayrollService } from '../services/payroll.service';
import { PayrollSettingsService } from '../services/payroll-settings.service';
import { successResponse } from '../../../core/utils/response';
import { AppError } from '../../../core/errors/AppError';
import { AuditHelper } from '../../../core/utils/audit.helper';

const payrollService = new PayrollService();
const payrollSettingsService = new PayrollSettingsService();

export class PayrollController {
  
  async getSettings(req: Request, res: Response, next: NextFunction) {
    try { 
      const settings = await payrollSettingsService.getFormattedSettings();
      successResponse(res, 200, 'Payroll settings retrieved', settings); 
    }
    catch (error) { next(error); }
  }
  
  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)._id;
      const settings = req.body;
      await payrollSettingsService.updateSettings(settings, userId);
      await AuditHelper.log(req, 'UPDATE', 'SYSTEM', undefined, 'SUCCESS', { after: settings }, 'Payroll settings updated');
      successResponse(res, 200, 'Payroll settings updated', settings);
    } catch (error) {
      await AuditHelper.log(req, 'UPDATE', 'SYSTEM', undefined, 'FAILURE', undefined, (error as Error).message);
      next(error);
    }
  }
  
  async generatePayrollRun(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)._id;
      const { period_name, period_type, start_date, end_date, payment_date, employee_ids } = req.body;
      // Get saved settings from database
      const savedSettings = await payrollSettingsService.getSettings();
      const payroll = await payrollService.generatePayrollRun(
        period_name, period_type, new Date(start_date), new Date(end_date), new Date(payment_date),
        employee_ids, savedSettings.toObject(), userId
      );
      await AuditHelper.log(req, 'CREATE', 'SYSTEM', payroll._id.toString(), 'SUCCESS', { after: { payroll_id: payroll.payroll_id, period_name, employees: payroll.employees.length } });
      successResponse(res, 201, 'Payroll run generated', payroll);
    } catch (error) {
      await AuditHelper.log(req, 'CREATE', 'SYSTEM', undefined, 'FAILURE', undefined, (error as Error).message);
      next(error);
    }
  }
  
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = { status: req.query.status as string, page: req.query.page ? parseInt(req.query.page as string) : 1, limit: req.query.limit ? parseInt(req.query.limit as string) : 20 };
      const result = await payrollService.findAll(filters);
      successResponse(res, 200, 'Payroll runs retrieved', result);
    } catch (error) { next(error); }
  }
  
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const payroll = await payrollService.findById(req.params.id);
      if (!payroll) throw new AppError('Payroll run not found', 404);
      successResponse(res, 200, 'Payroll run retrieved', payroll);
    } catch (error) { next(error); }
  }
  
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any)._id;
      const { status } = req.body;
      const oldPayroll = await payrollService.findById(req.params.id);
      if (!oldPayroll) throw new AppError('Payroll run not found', 404);
      const updated = await payrollService.updateStatus(req.params.id, status, userId);
      await AuditHelper.log(req, 'UPDATE', 'SYSTEM', req.params.id, 'SUCCESS', { before: { status: oldPayroll.status }, after: { status } });
      successResponse(res, 200, 'Payroll status updated', updated);
    } catch (error) { next(error); }
  }
  
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const summary = await payrollService.getSummary(year, month);
      successResponse(res, 200, 'Payroll summary retrieved', summary);
    } catch (error) { next(error); }
  }
  
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if ((req.user as any).role !== 'admin') throw new AppError('Only administrators can delete payroll runs', 403);
      const payroll = await payrollService.findById(req.params.id);
      if (!payroll) throw new AppError('Payroll run not found', 404);
      await payrollService.delete(req.params.id);
      await AuditHelper.log(req, 'DELETE', 'SYSTEM', req.params.id, 'SUCCESS', { before: { payroll_id: payroll.payroll_id, period_name: payroll.period_name } });
      successResponse(res, 200, 'Payroll run deleted');
    } catch (error) { next(error); }
  }
  
  async getPayslip(req: Request, res: Response, next: NextFunction) {
    try {
      const payroll = await payrollService.findById(req.params.payrollId);
      if (!payroll) throw new AppError('Payroll run not found', 404);
      const employee = payroll.employees.find(e => e.employee_id.toString() === req.params.employeeId);
      if (!employee) throw new AppError('Employee not found in this payroll run', 404);
      successResponse(res, 200, 'Payslip retrieved', { payroll, employee });
    } catch (error) { next(error); }
  }

  async generateEMP201(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ownerId = (req as any).user?._id;
      
      // Get the payroll run with populated items
      const payrollRun = await payrollService.findById(id);
      if (!payrollRun) {
        return res.status(404).json({ 
          success: false, 
          message: "Payroll run not found" 
        });
      }
      
      // Get items from payroll run
      const items = payrollRun.employees || [];
      
      if (items.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "No employee data found. Please calculate payroll first." 
        });
      }
      
      // Try to get company data
      let company = null;
      try {
        const CompanySettings = require('../../owner/models/CompanySettings').default;
        company = await CompanySettings.findOne({ ownerId });
      } catch (err) {
        console.log('CompanySettings model not found, using default values');
      }
      
      // Calculate totals from items
      const totalPAYE = items.reduce((sum: number, item: any) => sum + (item.deductions?.paye || 0), 0);
      const totalUIF = items.reduce((sum: number, item: any) => sum + (item.deductions?.uif || 0), 0);
      const totalSDL = items.reduce((sum: number, item: any) => sum + (item.deductions?.sdl || 0), 0);
      
      console.log(`📊 EMP201 Generation for ${payrollRun.period_name}:`);
      console.log(`   Items count: ${items.length}`);
      console.log(`   Total PAYE: R${totalPAYE}`);
      console.log(`   Total UIF: R${totalUIF}`);
      console.log(`   Total SDL: R${totalSDL}`);
      
      // Create PDF document
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=EMP201_${payrollRun.period_name.replace(/ /g, '_')}.pdf`);
      doc.pipe(res);
      
      // ============================================
      // PDF CONTENT
      // ============================================
      
      // Header
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .fillColor('#1a237e')
         .text('EMPLOYER MONTHLY DECLARATION', { align: 'center' });
      
      doc.fontSize(11)
         .font('Helvetica')
         .fillColor('#666666')
         .text('EMP201 - Monthly PAYE/SDL/UIF Declaration', { align: 'center' });
      
      doc.moveDown();
      doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.5);
      
      // SECTION A: EMPLOYER INFORMATION
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#1a237e')
         .text('SECTION A: EMPLOYER INFORMATION');
      
      doc.moveDown(0.3);
      
      const employerBoxY = doc.y;
      doc.rect(50, employerBoxY, 495, 90).stroke();
      
      const companyName = company?.name || payrollRun.companyName || 'Kago Human Capital';
      const regNumber = company?.registrationNumber || payrollRun.registrationNumber || '2020/123456/07';
      const payeRef = company?.payeReference || payrollRun.payeReference || '1234567890';
      const sdlRef = company?.sdlReference || payrollRun.sdlReference || 'SDL123456789';
      
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#333333')
         .text(`Employer Name: ${companyName}`, 60, employerBoxY + 10)
         .text(`Registration Number: ${regNumber}`, 60, employerBoxY + 30)
         .text(`PAYE Reference Number: ${payeRef}`, 60, employerBoxY + 50)
         .text(`SDL Reference Number: ${sdlRef}`, 60, employerBoxY + 70);
      
      doc.moveDown(4);
      
      // SECTION B: DECLARATION PERIOD
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#1a237e')
         .text('SECTION B: DECLARATION PERIOD');
      
      doc.moveDown(0.3);
      
      const periodBoxY = doc.y;
      doc.rect(50, periodBoxY, 495, 50).stroke();
      
      const periodStart = new Date(payrollRun.period_start_date || new Date());
      const periodEnd = new Date(payrollRun.period_end_date || new Date());
      
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#333333')
         .text(`Month: ${periodStart.toLocaleString('default', { month: 'long', year: 'numeric' })}`, 60, periodBoxY + 10)
         .text(`Period Start: ${periodStart.toLocaleDateString()}`, 60, periodBoxY + 30)
         .text(`Period End: ${periodEnd.toLocaleDateString()}`, 350, periodBoxY + 30);
      
      doc.moveDown(3);
      
      // SECTION C: TAX CALCULATION SUMMARY
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#1a237e')
         .text('SECTION C: TAX CALCULATION SUMMARY');
      
      doc.moveDown(0.5);
      
      const tableTop = doc.y;
      const col1X = 60;
      const col2X = 400;
      const rowHeight = 25;
      
      doc.rect(50, tableTop, 495, rowHeight).fill('#1a237e');
      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(10)
         .text('Description', col1X, tableTop + 8)
         .text('Amount (ZAR)', col2X, tableTop + 8);
      
      let currentY = tableTop + rowHeight;
      
      const rows = [
        { label: 'PAYE (Pay-As-You-Earn)', amount: totalPAYE },
        { label: 'SDL (Skills Development Levy)', amount: totalSDL },
        { label: 'UIF Employee Contribution', amount: totalUIF },
        { label: 'UIF Employer Contribution', amount: totalUIF },
      ];
      
      for (let i = 0; i < rows.length; i++) {
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }
        
        doc.rect(50, currentY, 495, 20).fill(i % 2 === 0 ? '#f9f9f9' : '#ffffff').stroke();
        doc.fillColor('#333333')
           .font('Helvetica')
           .fontSize(10)
           .text(rows[i].label, col1X, currentY + 5)
           .text(`R ${rows[i].amount.toLocaleString('en-ZA')}`, col2X, currentY + 5, { align: 'right' });
        
        currentY += 20;
      }
      
      doc.moveDown(2);
      
      // Total row
      const totalY = currentY + 10;
      doc.rect(50, totalY, 495, 25).fill('#1a237e');
      const totalAmount = totalPAYE + totalSDL + totalUIF + totalUIF;
      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(11)
         .text('TOTAL PAYABLE', col1X, totalY + 7)
         .text(`R ${totalAmount.toLocaleString('en-ZA')}`, col2X, totalY + 7, { align: 'right' });
      
      doc.moveDown(3);
      
      // SECTION D: EMPLOYEE DETAILS
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#1a237e')
         .text('SECTION D: EMPLOYEE DETAILS');
      
      doc.moveDown(0.5);
      
      let employeeRowY = doc.y;
      
      for (let i = 0; i < items.length; i++) {
        const emp = items[i];
        
        // Add page if needed
        if (employeeRowY > 750) {
          doc.addPage();
          employeeRowY = 50;
          doc.rect(50, employeeRowY, 495, 22).fill('#1a237e');
          doc.fillColor('#ffffff')
             .font('Helvetica-Bold')
             .fontSize(9)
             .text('Employee Name', 60, employeeRowY + 6)
             .text('Gross Pay', 250, employeeRowY + 6)
             .text('PAYE', 350, employeeRowY + 6)
             .text('UIF', 420, employeeRowY + 6)
             .text('Net Pay', 480, employeeRowY + 6, { align: 'right' });
          employeeRowY += 22;
        }
        
        if (i % 2 === 0) {
          doc.rect(50, employeeRowY - 2, 495, 20).fill('#f9f9f9');
        }
        
        doc.fillColor('#333333')
           .font('Helvetica')
           .fontSize(9)
           .text(emp.employee_name || 'Unknown', 60, employeeRowY)
           .text(`R ${(emp.gross_pay || 0).toLocaleString('en-ZA')}`, 250, employeeRowY)
           .text(`R ${(emp.deductions?.paye || 0).toLocaleString('en-ZA')}`, 350, employeeRowY)
           .text(`R ${(emp.deductions?.uif || 0).toLocaleString('en-ZA')}`, 420, employeeRowY)
           .text(`R ${(emp.net_pay || 0).toLocaleString('en-ZA')}`, 540, employeeRowY, { align: 'right' });
        
        employeeRowY += 20;
      }
      
      doc.moveDown(3);
      
      // SECTION E: DECLARATION
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#1a237e')
         .text('SECTION E: DECLARATION');
      
      doc.moveDown(0.5);
      
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#333333')
         .text('I, the undersigned, declare that the information provided in this return is true and correct.')
         .text('I understand that submitting false information may result in penalties and interest charges.');
      
      doc.moveDown(1.5);
      
      const signatureY = doc.y;
      doc.text('Signature: __________________________', 60, signatureY)
         .text('Date: ______________________________', 300, signatureY)
         .text('Capacity: __________________________', 60, signatureY + 25);
      
      doc.moveDown(4);
      
      // Footer
      doc.fontSize(8)
         .font('Helvetica')
         .fillColor('#999999')
         .text('Generated by Kago Human Capital Management System', { align: 'center' })
         .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' })
         .text(`Run ID: ${payrollRun._id}`, { align: 'center' });
      
      doc.end();
      
      console.log(`✅ EMP201 PDF generated for ${payrollRun.period_name} with ${items.length} employees`);
      
    } catch (error: any) {
      console.error('Error generating EMP201 PDF:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to generate EMP201 report" 
      });
    }
  }
}
