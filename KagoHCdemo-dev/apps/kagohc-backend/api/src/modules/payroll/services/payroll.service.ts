import { PayrollModel, IPayroll, PayrollPeriod } from '../models/payroll.model';
import { Employee } from '../../employee/models/employee.model';
import { Types } from 'mongoose';

export class PayrollService {
  
  calculateEmployeePayroll(employee: any, settings: any) {
    const basicSalary = employee.salary || 0;
    
    const uifEmployee = Math.min(basicSalary * (settings.uif_employee_rate / 100), 177.12);
    const uifEmployer = Math.min(basicSalary * (settings.uif_employer_rate / 100), 177.12);
    const sdl = basicSalary > settings.sdl_minimum_threshold ? basicSalary * (settings.sdl_rate / 100) : 0;
    const tax = basicSalary * 0.18;
    const medicalAid = basicSalary * (settings.medical_aid_percentage / 100);
    const pension = basicSalary * (settings.pension_percentage / 100);
    const totalDeductions = tax + uifEmployee + medicalAid + pension;
    const netSalary = basicSalary - totalDeductions;
    
    return { basic_salary: basicSalary, net_salary: netSalary, tax, uif_employee: uifEmployee, uif_employer: uifEmployer, sdl, medical_aid: medicalAid, pension, total_deductions: totalDeductions };
  }
  
  async generatePayrollRun(periodName: string, periodType: PayrollPeriod, startDate: Date, endDate: Date, paymentDate: Date, employeeIds: string[], settings: any, userId: string): Promise<IPayroll> {
    const employees = await Employee.find({ _id: { $in: employeeIds.map(id => new Types.ObjectId(id)) }, isActive: true }).populate('department');
    const payrollEmployees = [];
    let totalGross = 0, totalNet = 0, totalTax = 0, totalUIFEmployee = 0, totalUIFEmployer = 0, totalSDL = 0, totalMedicalAid = 0, totalPension = 0;
    
    for (const emp of employees) {
      const calc = this.calculateEmployeePayroll(emp, settings);
      payrollEmployees.push({
        employee_id: emp._id, employee_name: `${emp.firstName} ${emp.lastName}`, employee_code: emp.employeeId,
        department: (emp.department as any)?.name || 'Department', position: emp.position || 'Employee',
        basic_salary: calc.basic_salary, net_salary: calc.net_salary, payment_frequency: 'Monthly', employment_type: emp.employmentType || 'Full-time'
      });
      totalGross += calc.basic_salary; totalNet += calc.net_salary; totalTax += calc.tax;
      totalUIFEmployee += calc.uif_employee; totalUIFEmployer += calc.uif_employer;
      totalSDL += calc.sdl; totalMedicalAid += calc.medical_aid; totalPension += calc.pension;
    }
    
    return await PayrollModel.create({
      period_name: periodName, period_type: periodType, period_start: startDate, period_end: endDate, payment_date: paymentDate,
      employees: payrollEmployees, total_gross: totalGross, total_net: totalNet, total_tax: totalTax,
      total_uif_employee: totalUIFEmployee, total_uif_employer: totalUIFEmployer, total_sdl: totalSDL,
      total_medical_aid: totalMedicalAid, total_pension: totalPension, status: 'pending',
      createdBy: userId, updatedBy: userId
    });
  }
  
  async findAll(filters: any = {}) {
    const query: any = {};
    const page = filters.page || 1; const limit = filters.limit || 20; const skip = (page - 1) * limit;
    if (filters.status) query.status = filters.status;
    const [payroll, total] = await Promise.all([
      PayrollModel.find(query).sort({ payment_date: -1 }).skip(skip).limit(limit).lean(),
      PayrollModel.countDocuments(query)
    ]);
    return { data: payroll, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }
  
  async findById(id: string): Promise<IPayroll | null> { return await PayrollModel.findById(id); }
  
  async updateStatus(id: string, status: string, userId: string): Promise<IPayroll | null> {
    return await PayrollModel.findByIdAndUpdate(id, { status, processed_by: userId, processed_at: new Date(), updatedBy: userId }, { new: true });
  }
  
  async getSummary(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1); const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    const payrolls = await PayrollModel.find({ period_start: { $gte: startDate }, period_end: { $lte: endDate }, status: 'paid' });
    return payrolls.reduce((s, p) => ({
      total_gross: s.total_gross + p.total_gross, total_net: s.total_net + p.total_net, total_tax: s.total_tax + p.total_tax,
      total_uif: s.total_uif + p.total_uif_employee + p.total_uif_employer, total_sdl: s.total_sdl + p.total_sdl,
      total_medical_aid: s.total_medical_aid + p.total_medical_aid, total_pension: s.total_pension + p.total_pension,
      employee_count: s.employee_count + p.employees.length
    }), { total_gross: 0, total_net: 0, total_tax: 0, total_uif: 0, total_sdl: 0, total_medical_aid: 0, total_pension: 0, employee_count: 0 });
  }
  
  async delete(id: string): Promise<boolean> { return await PayrollModel.findByIdAndDelete(id) !== null; }
}
