// application/services/hrms/PayrollService.ts
// Payroll processing service - simplified version

import {
  Payslip,
  PayStructure,
  PayslipStatus,
  generatePayPeriod,
  calculateGrossEarnings,
  calculateTotalDeductions,
  calculateNetPayable,
  getPayModelLabel,
} from '../../../domain/entities/hrms/Payroll';
import { IPayrollRepository } from '../../../domain/interfaces/hrms/IPayrollRepository';
import {
  GeneratePayrollDTO,
  MarkPaidDTO,
  PayrollActionDTO,
  PayslipResponseDTO,
  PayrollSummaryDTO,
  PAYSLIP_STATUS_LABELS,
} from '../../dtos/hrms/PayrollDTO';

export class PayrollService {
  constructor(private payrollRepo: IPayrollRepository) {}

  async generatePayslips(
    dto: GeneratePayrollDTO,
    tenantId: string,
    generatedBy: string
  ): Promise<{ generated: number; errors: string[] }> {
    const period = generatePayPeriod(dto.year, dto.month);
    const errors: string[] = [];
    let generated = 0;

    // Use bulk generation from repository
    const payslips = await this.payrollRepo.generatePayslipsForPeriod(
      tenantId,
      period
    );

    generated = payslips.length;
    return { generated, errors };
  }

  async getPayslip(
    payslipId: string,
    tenantId: string
  ): Promise<PayslipResponseDTO | null> {
    const payslip = await this.payrollRepo.findPayslipById(payslipId, tenantId);
    if (!payslip) return null;
    return this.toPayslipDTO(payslip);
  }

  async getEmployeePayslip(
    employeeId: string,
    year: number,
    month: number,
    tenantId: string
  ): Promise<PayslipResponseDTO | null> {
    const payslip = await this.payrollRepo.findPayslip(
      employeeId,
      year,
      month,
      tenantId
    );
    if (!payslip) return null;
    return this.toPayslipDTO(payslip);
  }

  async listPayslips(
    tenantId: string,
    filters: { year?: number; month?: number; status?: PayslipStatus }
  ): Promise<PayslipResponseDTO[]> {
    const payslips = await this.payrollRepo.findAllPayslips(tenantId, filters);
    return payslips.map((p) => this.toPayslipDTO(p));
  }

  async approvePayslips(
    dto: PayrollActionDTO,
    tenantId: string,
    approvedBy: string
  ): Promise<void> {
    if (dto.action === 'approve') {
      await this.payrollRepo.approvePayslips(dto.payslipIds, approvedBy, tenantId);
    }
  }

  async markAsPaid(dto: MarkPaidDTO, tenantId: string): Promise<void> {
    await this.payrollRepo.markAsPaid(
      dto.payslipIds,
      dto.paymentMode,
      dto.paymentReference || '',
      tenantId
    );
  }

  async getPayrollSummary(
    tenantId: string,
    year: number,
    month: number
  ): Promise<PayrollSummaryDTO> {
    const period = generatePayPeriod(year, month);
    const summary = await this.payrollRepo.getPayrollSummary(tenantId, period);

    const monthLabel = new Date(year, month - 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    const statusCounts = summary.byStatus;
    const total = summary.totalEmployees;

    return {
      period: { year, month, label: monthLabel },
      totalEmployees: total,
      generated: total,
      pending: statusCounts['PENDING_APPROVAL'] || 0,
      approved: statusCounts['APPROVED'] || 0,
      paid: statusCounts['PAID'] || 0,
      totalGross: summary.totalGross,
      totalDeductions: summary.totalDeductions,
      totalNet: summary.totalNet,
      byCategory: [],
      progressPercentage: total > 0 ? (statusCounts['PAID'] || 0) / total * 100 : 0,
    };
  }

  private toPayslipDTO(payslip: Payslip): PayslipResponseDTO {
    const monthLabel = new Date(
      payslip.period.year,
      payslip.period.month - 1
    ).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return {
      id: payslip.id,
      employeeId: payslip.employeeId,
      employeeName: '', // To be populated by controller
      employeeCode: '',
      period: {
        year: payslip.period.year,
        month: payslip.period.month,
        label: monthLabel,
      },
      attendance: {
        presentDays: payslip.presentDays,
        absentDays: payslip.absentDays,
        leaveDays: payslip.leaveDays,
        tripDays: payslip.tripDays,
        overtimeHours: payslip.overtimeHours,
      },
      earnings: payslip.earnings.map((e) => ({
        code: e.code,
        name: e.name,
        amount: e.amount,
      })),
      grossEarnings: payslip.grossEarnings,
      tripEarnings: payslip.tripEarnings.map((t) => ({
        tripName: t.tripName,
        role: t.role,
        days: t.days,
        amount: t.amount,
      })),
      totalTripEarnings: payslip.totalTripEarnings,
      deductions: payslip.deductions.map((d) => ({
        code: d.code,
        name: d.name,
        amount: d.amount,
      })),
      totalDeductions: payslip.totalDeductions,
      reimbursements: payslip.reimbursements.map((r) => ({
        code: r.code,
        name: r.name,
        amount: r.amount,
      })),
      totalReimbursements: payslip.totalReimbursements,
      netPayable: payslip.netPayable,
      netPayableInWords: this.numberToWords(payslip.netPayable),
      status: payslip.status,
      statusLabel: PAYSLIP_STATUS_LABELS[payslip.status],
      paymentMode: payslip.paymentMode,
      paymentReference: payslip.paymentReference,
      paidAt: payslip.paidAt?.toISOString(),
      generatedAt: payslip.generatedAt.toISOString(),
      approvedAt: payslip.approvedAt?.toISOString(),
    };
  }

  private numberToWords(num: number): string {
    // Simplified - just format for now
    return `Rupees ${num.toLocaleString('en-IN')} only`;
  }
}
