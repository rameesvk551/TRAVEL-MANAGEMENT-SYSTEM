import { Pool } from 'pg';
import { VendorDispute, VendorDisputeProps } from '../../../domain/entities/vendor/VendorDispute';
import { IVendorDisputeRepository, VendorDisputeFilters } from '../../../domain/interfaces/vendor/IVendorDisputeRepository';

export class VendorDisputeRepository implements IVendorDisputeRepository {
    constructor(private pool: Pool) {}

    async findById(id: string): Promise<VendorDispute | null> {
        const result = await this.pool.query(
            `SELECT vd.*, 
                    json_agg(de.*) FILTER (WHERE de.id IS NOT NULL) as evidence
             FROM vendor_disputes vd
             LEFT JOIN dispute_evidence de ON de.dispute_id = vd.id
             WHERE vd.id = $1
             GROUP BY vd.id`,
            [id]
        );

        if (result.rows.length === 0) return null;
        return this.mapToEntity(result.rows[0]);
    }

    async findByVendorId(vendorId: string): Promise<VendorDispute[]> {
        const result = await this.pool.query(
            `SELECT vd.*, 
                    json_agg(de.*) FILTER (WHERE de.id IS NOT NULL) as evidence
             FROM vendor_disputes vd
             LEFT JOIN dispute_evidence de ON de.dispute_id = vd.id
             WHERE vd.vendor_id = $1
             GROUP BY vd.id
             ORDER BY vd.created_at DESC`,
            [vendorId]
        );

        return result.rows.map(row => this.mapToEntity(row));
    }

    async findByPayableId(payableId: string): Promise<VendorDispute[]> {
        const result = await this.pool.query(
            `SELECT vd.*, 
                    json_agg(de.*) FILTER (WHERE de.id IS NOT NULL) as evidence
             FROM vendor_disputes vd
             LEFT JOIN dispute_evidence de ON de.dispute_id = vd.id
             WHERE vd.payable_id = $1
             GROUP BY vd.id
             ORDER BY vd.created_at DESC`,
            [payableId]
        );

        return result.rows.map(row => this.mapToEntity(row));
    }

    async findAll(filters: VendorDisputeFilters): Promise<{ data: VendorDispute[]; total: number }> {
        const conditions: string[] = ['1=1'];
        const params: any[] = [];
        let paramIndex = 1;

        if (filters.tenantId) {
            conditions.push(`vd.tenant_id = $${paramIndex++}`);
            params.push(filters.tenantId);
        }

        if (filters.vendorId) {
            conditions.push(`vd.vendor_id = $${paramIndex++}`);
            params.push(filters.vendorId);
        }

        if (filters.payableId) {
            conditions.push(`vd.payable_id = $${paramIndex++}`);
            params.push(filters.payableId);
        }

        if (filters.assignmentId) {
            conditions.push(`vd.assignment_id = $${paramIndex++}`);
            params.push(filters.assignmentId);
        }

        if (filters.status) {
            conditions.push(`vd.status = $${paramIndex++}`);
            params.push(filters.status);
        }

        if (filters.disputeType) {
            conditions.push(`vd.dispute_type = $${paramIndex++}`);
            params.push(filters.disputeType);
        }

        if (filters.priority) {
            conditions.push(`vd.priority = $${paramIndex++}`);
            params.push(filters.priority);
        }

        if (filters.raisedBy) {
            conditions.push(`vd.raised_by = $${paramIndex++}`);
            params.push(filters.raisedBy);
        }

        if (filters.assignedTo) {
            conditions.push(`vd.assigned_to = $${paramIndex++}`);
            params.push(filters.assignedTo);
        }

        const whereClause = conditions.join(' AND ');
        const limit = filters.limit || 50;
        const offset = filters.offset || 0;

        const countResult = await this.pool.query(
            `SELECT COUNT(*) FROM vendor_disputes vd WHERE ${whereClause}`,
            params
        );

        const dataResult = await this.pool.query(
            `SELECT vd.*, 
                    json_agg(de.*) FILTER (WHERE de.id IS NOT NULL) as evidence
             FROM vendor_disputes vd
             LEFT JOIN dispute_evidence de ON de.dispute_id = vd.id
             WHERE ${whereClause}
             GROUP BY vd.id
             ORDER BY vd.created_at DESC 
             LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
            [...params, limit, offset]
        );

        return {
            data: dataResult.rows.map(row => this.mapToEntity(row)),
            total: parseInt(countResult.rows[0].count),
        };
    }

    async findOpenDisputes(): Promise<VendorDispute[]> {
        const result = await this.pool.query(
            `SELECT vd.*, 
                    json_agg(de.*) FILTER (WHERE de.id IS NOT NULL) as evidence
             FROM vendor_disputes vd
             LEFT JOIN dispute_evidence de ON de.dispute_id = vd.id
             WHERE vd.status NOT IN ('resolved', 'closed', 'withdrawn')
             GROUP BY vd.id
             ORDER BY 
                CASE vd.priority 
                    WHEN 'critical' THEN 1 
                    WHEN 'high' THEN 2 
                    WHEN 'medium' THEN 3 
                    ELSE 4 
                END,
                vd.created_at ASC`
        );

        return result.rows.map(row => this.mapToEntity(row));
    }

    async save(dispute: VendorDispute): Promise<VendorDispute> {
        const props = dispute.toObject();
        
        const result = await this.pool.query(
            `INSERT INTO vendor_disputes (
                id, tenant_id, dispute_number, vendor_id, payable_id, assignment_id,
                dispute_type, subject, description, disputed_amount, status,
                priority, raised_by, raised_by_party, assigned_to, resolution,
                resolution_amount, resolution_notes, resolved_by, resolved_at,
                due_date, metadata, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
            )
            ON CONFLICT (id) DO UPDATE SET
                subject = EXCLUDED.subject,
                description = EXCLUDED.description,
                disputed_amount = EXCLUDED.disputed_amount,
                status = EXCLUDED.status,
                priority = EXCLUDED.priority,
                assigned_to = EXCLUDED.assigned_to,
                resolution = EXCLUDED.resolution,
                resolution_amount = EXCLUDED.resolution_amount,
                resolution_notes = EXCLUDED.resolution_notes,
                resolved_by = EXCLUDED.resolved_by,
                resolved_at = EXCLUDED.resolved_at,
                due_date = EXCLUDED.due_date,
                metadata = EXCLUDED.metadata,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *`,
            [
                props.id,
                props.tenantId,
                props.disputeNumber,
                props.vendorId,
                props.payableId,
                props.assignmentId,
                props.disputeType,
                props.subject,
                props.description,
                props.disputedAmount,
                props.status,
                props.priority,
                props.raisedBy,
                props.raisedByParty,
                props.assignedTo,
                props.resolution,
                props.resolutionAmount,
                props.resolutionNotes,
                props.resolvedBy,
                props.resolvedAt,
                props.dueDate,
                JSON.stringify(props.metadata),
                props.createdAt,
                props.updatedAt,
            ]
        );

        // Save evidence if present
        if (props.evidence && props.evidence.length > 0) {
            for (const evidence of props.evidence) {
                await this.pool.query(
                    `INSERT INTO dispute_evidence (
                        id, dispute_id, evidence_type, title, description,
                        file_url, file_name, file_size, uploaded_by, uploaded_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    ON CONFLICT (id) DO NOTHING`,
                    [
                        evidence.id,
                        props.id,
                        evidence.evidenceType,
                        evidence.title,
                        evidence.description,
                        evidence.fileUrl,
                        evidence.fileName,
                        evidence.fileSize,
                        evidence.uploadedBy,
                        evidence.uploadedAt,
                    ]
                );
            }
        }

        return this.mapToEntity(result.rows[0]);
    }

    async addEvidence(
        disputeId: string,
        evidence: {
            id: string;
            evidenceType: string;
            title: string;
            description?: string;
            fileUrl: string;
            fileName: string;
            fileSize: number;
            uploadedBy: string;
        }
    ): Promise<void> {
        await this.pool.query(
            `INSERT INTO dispute_evidence (
                id, dispute_id, evidence_type, title, description,
                file_url, file_name, file_size, uploaded_by, uploaded_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
            [
                evidence.id,
                disputeId,
                evidence.evidenceType,
                evidence.title,
                evidence.description,
                evidence.fileUrl,
                evidence.fileName,
                evidence.fileSize,
                evidence.uploadedBy,
            ]
        );
    }

    async delete(id: string): Promise<void> {
        // Delete evidence first due to FK constraint
        await this.pool.query(`DELETE FROM dispute_evidence WHERE dispute_id = $1`, [id]);
        await this.pool.query(`DELETE FROM vendor_disputes WHERE id = $1`, [id]);
    }

    private mapToEntity(row: any): VendorDispute {
        const evidence = row.evidence && Array.isArray(row.evidence) && row.evidence[0]
            ? row.evidence.map((e: any) => ({
                id: e.id,
                evidenceType: e.evidence_type,
                title: e.title,
                description: e.description,
                fileUrl: e.file_url,
                fileName: e.file_name,
                fileSize: e.file_size,
                uploadedBy: e.uploaded_by,
                uploadedAt: e.uploaded_at,
            }))
            : [];

        return VendorDispute.create({
            id: row.id,
            tenantId: row.tenant_id,
            disputeNumber: row.dispute_number,
            vendorId: row.vendor_id,
            payableId: row.payable_id,
            assignmentId: row.assignment_id,
            disputeType: row.dispute_type,
            subject: row.subject,
            description: row.description,
            disputedAmount: row.disputed_amount ? parseFloat(row.disputed_amount) : undefined,
            status: row.status,
            priority: row.priority,
            raisedBy: row.raised_by,
            raisedByParty: row.raised_by_party,
            assignedTo: row.assigned_to,
            resolution: row.resolution,
            resolutionAmount: row.resolution_amount ? parseFloat(row.resolution_amount) : undefined,
            resolutionNotes: row.resolution_notes,
            resolvedBy: row.resolved_by,
            resolvedAt: row.resolved_at,
            dueDate: row.due_date,
            evidence,
            metadata: row.metadata,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        });
    }
}
