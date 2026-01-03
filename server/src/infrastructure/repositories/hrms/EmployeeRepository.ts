import {
  Employee as EmployeeEntity,
  EmployeeType,
  EmployeeCategory,
  LifecycleStage,
  ContactInfo,
  EmergencyContact,
} from '../../../domain/entities/hrms/Employee.js';
import {
  IEmployeeRepository,
  EmployeeFilters,
  EmployeePagination,
  PaginatedResult,
} from '../../../domain/interfaces/hrms/IEmployeeRepository.js';
import { Employee as EmployeeModel } from '../../database/sequelize/models/Employee.js';
import { Op } from 'sequelize';

export class EmployeeRepository implements IEmployeeRepository {
  private toDomain(model: EmployeeModel): EmployeeEntity {
    return {
      id: model.id,
      tenantId: model.tenant_id,
      employeeCode: model.employee_code,
      firstName: model.first_name,
      lastName: model.last_name || '',
      preferredName: model.preferred_name,
      type: model.type as EmployeeType,
      category: model.category as EmployeeCategory,
      branchId: model.branch_id,
      departmentId: model.department_id,
      reportingTo: model.reporting_to,
      costCenterId: model.cost_center_id,
      joiningDate: model.joining_date ? new Date(model.joining_date) : new Date(),
      probationEndDate: model.probation_end_date ? new Date(model.probation_end_date) : undefined,
      confirmationDate: model.confirmation_date ? new Date(model.confirmation_date) : undefined,
      lifecycleStage: model.lifecycle_stage as LifecycleStage,
      isActive: model.is_active,
      contact: (model.contact as unknown as ContactInfo) || { email: '', phone: '' },
      emergencyContacts: (model.emergency_contacts as unknown as EmergencyContact[]) || [],
      attributes: (model.attributes as Record<string, unknown>) || {},
      createdAt: model.created_at,
      updatedAt: model.updated_at,
      createdBy: model.created_by || '',
    };
  }

  async findById(id: string, tenantId: string): Promise<EmployeeEntity | null> {
    const employee = await EmployeeModel.findOne({
      where: { id, tenant_id: tenantId }
    });
    return employee ? this.toDomain(employee) : null;
  }

  async findByCode(code: string, tenantId: string): Promise<EmployeeEntity | null> {
    const employee = await EmployeeModel.findOne({
      where: { employee_code: code, tenant_id: tenantId }
    });
    return employee ? this.toDomain(employee) : null;
  }

  async findByEmail(email: string, tenantId: string): Promise<EmployeeEntity | null> {
    const employee = await EmployeeModel.findOne({
      where: {
        tenant_id: tenantId,
        contact: {
          email: email
        }
      }
    });
    return employee ? this.toDomain(employee) : null;
  }

  async findAll(
    tenantId: string,
    filters: EmployeeFilters,
    pagination: EmployeePagination
  ): Promise<PaginatedResult<EmployeeEntity>> {
    const where: any = { tenant_id: tenantId };

    if (filters.type) where.type = filters.type;
    if (filters.category) where.category = filters.category;
    if (filters.branchId) where.branch_id = filters.branchId;
    if (filters.departmentId) where.department_id = filters.departmentId;
    if (filters.lifecycleStage) where.lifecycle_stage = filters.lifecycleStage;
    if (filters.isActive !== undefined) where.is_active = filters.isActive;
    if (filters.search) {
      where[Op.or] = [
        { first_name: { [Op.iLike]: `%${filters.search}%` } },
        { last_name: { [Op.iLike]: `%${filters.search}%` } },
        { employee_code: { [Op.iLike]: `%${filters.search}%` } }
      ];
    }

    const limit = pagination.limit || 20;
    const page = pagination.page || 1;
    const offset = (page - 1) * limit;
    const sortBy = pagination.sortBy || 'created_at';
    const sortOrder = pagination.sortOrder || 'desc';

    const { count, rows } = await EmployeeModel.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]]
    });

    return {
      data: rows.map(r => this.toDomain(r)),
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  }

  async findByReportingTo(managerId: string, tenantId: string): Promise<EmployeeEntity[]> {
    const employees = await EmployeeModel.findAll({
      where: { reporting_to: managerId, tenant_id: tenantId },
      order: [['first_name', 'ASC'], ['last_name', 'ASC']]
    });
    return employees.map(e => this.toDomain(e));
  }

  async findAvailable(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    skills?: string[]
  ): Promise<EmployeeEntity[]> {
    // This is a complex query that might need raw SQL or specialized Sequelize logic
    // For now, implementing a simplified version or using raw query via Sequelize
    const query = `
      SELECT e.* FROM employees e
      WHERE e.tenant_id = :tenantId 
        AND e.is_active = true 
        AND e.category IN ('FIELD_STAFF', 'SEASONAL', 'CONTRACT')
        AND NOT EXISTS (
          SELECT 1 FROM trip_assignments ta
          WHERE ta.employee_id = e.id
            AND ta.status NOT IN ('CANCELLED', 'DECLINED')
            AND ta.start_date <= :endDate AND ta.end_date >= :startDate
        )
        AND NOT EXISTS (
          SELECT 1 FROM leave_requests lr
          WHERE lr.employee_id = e.id
            AND lr.status = 'APPROVED'
            AND lr.from_date <= :endDate AND lr.to_date >= :startDate
        )
    `;

    const employees = await EmployeeModel.sequelize!.query(query, {
      replacements: { tenantId, startDate, endDate },
      model: EmployeeModel,
      mapToModel: true
    });

    return employees.map(e => this.toDomain(e));
  }

  async create(employee: Omit<EmployeeEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmployeeEntity> {
    const created = await EmployeeModel.create({
      tenant_id: employee.tenantId,
      employee_code: employee.employeeCode,
      first_name: employee.firstName,
      last_name: employee.lastName,
      preferred_name: employee.preferredName,
      type: employee.type,
      category: employee.category,
      branch_id: employee.branchId,
      department_id: employee.departmentId,
      reporting_to: employee.reportingTo,
      cost_center_id: employee.costCenterId,
      joining_date: employee.joiningDate,
      probation_end_date: employee.probationEndDate,
      confirmation_date: employee.confirmationDate,
      lifecycle_stage: employee.lifecycleStage,
      is_active: employee.isActive,
      contact: employee.contact as any,
      emergency_contacts: employee.emergencyContacts as any,
      attributes: employee.attributes,
      created_by: employee.createdBy,
    });
    return this.toDomain(created);
  }

  async update(id: string, data: Partial<EmployeeEntity>): Promise<EmployeeEntity> {
    const [affectedCount] = await EmployeeModel.update(
      {
        first_name: data.firstName,
        last_name: data.lastName,
        preferred_name: data.preferredName,
        type: data.type,
        category: data.category,
        branch_id: data.branchId,
        department_id: data.departmentId,
        reporting_to: data.reportingTo,
        cost_center_id: data.costCenterId,
        joining_date: data.joiningDate,
        probation_end_date: data.probationEndDate,
        confirmation_date: data.confirmationDate,
        lifecycle_stage: data.lifecycleStage,
        is_active: data.isActive,
        contact: data.contact as any,
        emergency_contacts: data.emergencyContacts as any,
        attributes: data.attributes,
      },
      { where: { id } }
    );

    if (affectedCount === 0) {
      throw new Error('Employee not found');
    }

    const updated = await EmployeeModel.findByPk(id);
    if (!updated) throw new Error('Employee not found after update');
    return this.toDomain(updated);
  }

  async softDelete(id: string): Promise<void> {
    await EmployeeModel.update(
      { is_active: false, lifecycle_stage: 'ARCHIVED' },
      { where: { id } }
    );
  }

  async generateEmployeeCode(tenantId: string): Promise<string> {
    const latest = await EmployeeModel.findOne({
      where: {
        tenant_id: tenantId,
        employee_code: { [Op.regexp]: '^EMP[0-9]+$' }
      },
      order: [['employee_code', 'DESC']]
    });

    const maxNum = latest ? parseInt(latest.employee_code.substring(3)) : 0;
    return `EMP${String(maxNum + 1).padStart(5, '0')}`;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await EmployeeModel.destroy({
      where: { id, tenant_id: tenantId }
    });
  }

  async findByBranch(branchId: string, tenantId: string): Promise<EmployeeEntity[]> {
    const employees = await EmployeeModel.findAll({
      where: { branch_id: branchId, tenant_id: tenantId }
    });
    return employees.map(e => this.toDomain(e));
  }

  async findByDepartment(departmentId: string, tenantId: string): Promise<EmployeeEntity[]> {
    const employees = await EmployeeModel.findAll({
      where: { department_id: departmentId, tenant_id: tenantId }
    });
    return employees.map(e => this.toDomain(e));
  }

  async countByTenant(tenantId: string): Promise<number> {
    return await EmployeeModel.count({
      where: { tenant_id: tenantId }
    });
  }

  async countByLifecycleStage(tenantId: string): Promise<Record<LifecycleStage, number>> {
    const results = await EmployeeModel.findAll({
      attributes: ['lifecycle_stage', [EmployeeModel.sequelize!.fn('COUNT', EmployeeModel.sequelize!.col('id')), 'count']],
      where: { tenant_id: tenantId },
      group: ['lifecycle_stage'],
      raw: true
    }) as unknown as { lifecycle_stage: string; count: string }[];

    const counts: Record<LifecycleStage, number> = {
      PRE_HIRE: 0, ONBOARDING: 0, ACTIVE: 0, ON_LEAVE: 0,
      NOTICE: 0, RESIGNED: 0, TERMINATED: 0, ARCHIVED: 0
    };
    results.forEach(row => {
      if (row.lifecycle_stage) counts[row.lifecycle_stage as LifecycleStage] = parseInt(row.count, 10);
    });
    return counts;
  }
}
