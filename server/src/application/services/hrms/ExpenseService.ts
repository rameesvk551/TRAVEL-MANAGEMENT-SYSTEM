// application/services/hrms/ExpenseService.ts
// Expense Service Implementation

import type { IExpenseRepository, ExpenseFilters } from '../../../domain/interfaces/hrms/IExpenseRepository';
import type { ExpenseClaim, ExpenseItem } from '../../../domain/entities/hrms/Expense';
import type {
  CreateExpenseClaimDTO,
  UpdateExpenseClaimDTO,
  ExpenseFiltersDTO,
  ApproveExpenseDTO,
  RejectExpenseDTO,
  MarkPaidDTO,
  ExpenseClaimResponseDTO,
  ExpenseStatsResponseDTO,
} from '../../dtos/hrms/ExpenseDTO';
import { ExpenseMapper } from '../../dtos/hrms/ExpenseDTO';
import { NotFoundError, ValidationError, ForbiddenError } from '../../../shared/errors/AppError';

export class ExpenseService {
  constructor(private expenseRepository: IExpenseRepository) {}

  async getById(id: string): Promise<ExpenseClaimResponseDTO> {
    const expense = await this.expenseRepository.findById(id);
    if (!expense) {
      throw new NotFoundError('Expense claim not found');
    }
    return ExpenseMapper.toResponseDTO(expense);
  }

  async getByClaimNumber(claimNumber: string): Promise<ExpenseClaimResponseDTO> {
    const expense = await this.expenseRepository.findByClaimNumber(claimNumber);
    if (!expense) {
      throw new NotFoundError('Expense claim not found');
    }
    return ExpenseMapper.toResponseDTO(expense);
  }

  async getAll(tenantId: string, filters: ExpenseFiltersDTO): Promise<ExpenseClaimResponseDTO[]> {
    const repoFilters: ExpenseFilters = {
      tenantId,
      employeeId: filters.employeeId,
      status: filters.status,
      tripId: filters.tripId,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    };

    const expenses = await this.expenseRepository.findAll(repoFilters);
    return expenses.map(ExpenseMapper.toResponseDTO);
  }

  async getByEmployee(employeeId: string, tenantId: string): Promise<ExpenseClaimResponseDTO[]> {
    const expenses = await this.expenseRepository.findByEmployee(employeeId, tenantId);
    return expenses.map(ExpenseMapper.toResponseDTO);
  }

  async getPendingApproval(tenantId: string, approverId?: string): Promise<ExpenseClaimResponseDTO[]> {
    const expenses = await this.expenseRepository.findPendingApproval(tenantId, approverId);
    return expenses.map(ExpenseMapper.toResponseDTO);
  }

  async create(
    tenantId: string,
    employeeId: string,
    userId: string,
    dto: CreateExpenseClaimDTO
  ): Promise<ExpenseClaimResponseDTO> {
    // Generate claim number
    const claimNumber = await this.generateClaimNumber(tenantId);

    // Calculate total amount
    const totalAmount = dto.items.reduce((sum, item) => sum + item.amount, 0);

    const items: Omit<ExpenseItem, 'id'>[] = dto.items.map(item => ({
      description: item.description,
      category: item.category,
      amount: item.amount,
      currency: item.currency,
      date: new Date(item.date),
      paymentMethod: item.paymentMethod,
      receiptUrl: item.receiptUrl,
      receiptFileName: item.receiptFileName,
      notes: item.notes,
    }));

    const expense: Omit<ExpenseClaim, 'id'> = {
      tenantId,
      employeeId,
      claimNumber,
      title: dto.title,
      description: dto.description,
      tripId: dto.tripId,
      items: items as ExpenseItem[],
      totalAmount,
      currency: dto.currency,
      status: 'DRAFT',
      attachments: dto.attachments || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
    };

    const created = await this.expenseRepository.create(expense);
    return ExpenseMapper.toResponseDTO(created);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateExpenseClaimDTO
  ): Promise<ExpenseClaimResponseDTO> {
    const existing = await this.expenseRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Expense claim not found');
    }

    // Only allow updates on draft claims
    if (existing.status !== 'DRAFT') {
      throw new ValidationError('Can only update draft expense claims');
    }

    // Only the creator can update
    if (existing.createdBy !== userId) {
      throw new ForbiddenError('You can only update your own expense claims');
    }

    const updated = await this.expenseRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundError('Failed to update expense claim');
    }

    return ExpenseMapper.toResponseDTO(updated);
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.expenseRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Expense claim not found');
    }

    // Only allow delete on draft claims
    if (existing.status !== 'DRAFT') {
      throw new ValidationError('Can only delete draft expense claims');
    }

    // Only the creator can delete
    if (existing.createdBy !== userId) {
      throw new ForbiddenError('You can only delete your own expense claims');
    }

    await this.expenseRepository.delete(id);
  }

  async submit(id: string, userId: string): Promise<ExpenseClaimResponseDTO> {
    const existing = await this.expenseRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Expense claim not found');
    }

    if (existing.status !== 'DRAFT') {
      throw new ValidationError('Can only submit draft expense claims');
    }

    if (existing.items.length === 0) {
      throw new ValidationError('Cannot submit expense claim with no items');
    }

    // Only the creator can submit
    if (existing.createdBy !== userId) {
      throw new ForbiddenError('You can only submit your own expense claims');
    }

    const submitted = await this.expenseRepository.submit(id);
    if (!submitted) {
      throw new NotFoundError('Failed to submit expense claim');
    }

    return ExpenseMapper.toResponseDTO(submitted);
  }

  async approve(
    id: string,
    approverId: string,
    dto: ApproveExpenseDTO
  ): Promise<ExpenseClaimResponseDTO> {
    const existing = await this.expenseRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Expense claim not found');
    }

    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(existing.status)) {
      throw new ValidationError('Can only approve submitted or under review expense claims');
    }

    const approved = await this.expenseRepository.approve(id, approverId, dto.comments);
    if (!approved) {
      throw new NotFoundError('Failed to approve expense claim');
    }

    return ExpenseMapper.toResponseDTO(approved);
  }

  async reject(
    id: string,
    rejectorId: string,
    dto: RejectExpenseDTO
  ): Promise<ExpenseClaimResponseDTO> {
    const existing = await this.expenseRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Expense claim not found');
    }

    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(existing.status)) {
      throw new ValidationError('Can only reject submitted or under review expense claims');
    }

    const rejected = await this.expenseRepository.reject(id, rejectorId, dto.reason);
    if (!rejected) {
      throw new NotFoundError('Failed to reject expense claim');
    }

    return ExpenseMapper.toResponseDTO(rejected);
  }

  async markAsPaid(id: string, dto: MarkPaidDTO): Promise<ExpenseClaimResponseDTO> {
    const existing = await this.expenseRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Expense claim not found');
    }

    if (existing.status !== 'APPROVED') {
      throw new ValidationError('Can only mark approved expense claims as paid');
    }

    const paid = await this.expenseRepository.markAsPaid(id, dto.paymentReference);
    if (!paid) {
      throw new NotFoundError('Failed to mark expense claim as paid');
    }

    return ExpenseMapper.toResponseDTO(paid);
  }

  async getStats(
    tenantId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ExpenseStatsResponseDTO> {
    const stats = await this.expenseRepository.getStats(
      tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    return ExpenseMapper.toStatsResponseDTO(stats);
  }

  async getEmployeeExpenseTotal(
    employeeId: string,
    startDate: string,
    endDate: string
  ): Promise<number> {
    return this.expenseRepository.getEmployeeExpenseTotal(
      employeeId,
      new Date(startDate),
      new Date(endDate)
    );
  }

  private async generateClaimNumber(tenantId: string): Promise<string> {
    const prefix = 'EXP';
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString(36).toUpperCase();
    return `${prefix}-${year}-${timestamp}`;
  }
}
