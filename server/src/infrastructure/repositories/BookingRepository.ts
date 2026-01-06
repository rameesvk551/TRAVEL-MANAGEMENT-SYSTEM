import { Booking as BookingEntity, BookingStatus, BookingSource } from '../../domain/entities/Booking.js';
import { IBookingRepository, BookingFilters } from '../../domain/interfaces/IBookingRepository.js';
import { Booking as BookingModel } from '../database/sequelize/models/Booking.js';
import { Op } from 'sequelize';

function toEntity(model: BookingModel): BookingEntity {
    return BookingEntity.fromPersistence({
        id: model.id,
        tenantId: model.tenant_id,
        resourceId: model.resource_id || '',
        departureId: model.departure_id,
        holdId: model.hold_id,
        leadId: model.lead_id,
        createdById: model.created_by_id,
        source: model.source as BookingSource,
        sourcePlatform: model.source_platform,
        externalRef: model.external_ref,
        startDate: model.start_date || new Date(),
        endDate: model.end_date || new Date(),
        status: model.status as BookingStatus,
        guestName: model.guest_name,
        guestEmail: model.guest_email,
        guestPhone: model.guest_phone,
        guestCount: model.guest_count || 1,
        baseAmount: Number(model.base_amount) || 0,
        taxAmount: Number(model.tax_amount) || 0,
        totalAmount: Number(model.total_amount) || 0,
        currency: model.currency || 'INR',
        notes: model.notes,
        metadata: (model.metadata as Record<string, unknown>) || {},
        createdAt: model.created_at,
        updatedAt: model.updated_at,
    });
}

export class BookingRepository implements IBookingRepository {
    async save(booking: BookingEntity): Promise<BookingEntity> {
        const [instance, created] = await BookingModel.findOrCreate({
            where: { id: booking.id },
            defaults: {
                id: booking.id,
                tenant_id: booking.tenantId,
                resource_id: booking.resourceId,
                departure_id: booking.departureId,
                hold_id: booking.holdId,
                lead_id: booking.leadId,
                created_by_id: booking.createdById,
                booking_number: `BK-${Date.now()}`,
                source: booking.source,
                source_platform: booking.sourcePlatform,
                external_ref: booking.externalRef,
                start_date: booking.startDate,
                end_date: booking.endDate,
                status: booking.status,
                guest_name: booking.guestName,
                guest_email: booking.guestEmail,
                guest_phone: booking.guestPhone,
                guest_count: booking.guestCount,
                base_amount: booking.baseAmount,
                tax_amount: booking.taxAmount,
                total_amount: booking.totalAmount,
                currency: booking.currency,
                notes: booking.notes,
                metadata: booking.metadata,
            }
        });

        if (!created) {
            await instance.update({
                departure_id: booking.departureId,
                hold_id: booking.holdId,
                start_date: booking.startDate,
                end_date: booking.endDate,
                status: booking.status,
                guest_name: booking.guestName,
                guest_email: booking.guestEmail,
                guest_phone: booking.guestPhone,
                guest_count: booking.guestCount,
                base_amount: booking.baseAmount,
                tax_amount: booking.taxAmount,
                total_amount: booking.totalAmount,
                notes: booking.notes,
                metadata: booking.metadata,
            });
        }

        return toEntity(instance);
    }

    async findById(id: string, tenantId: string): Promise<BookingEntity | null> {
        const booking = await BookingModel.findOne({
            where: { id, tenant_id: tenantId }
        });
        return booking ? toEntity(booking) : null;
    }

    async findAll(tenantId: string, filters: BookingFilters): Promise<{ bookings: BookingEntity[]; total: number }> {
        const where: any = { tenant_id: tenantId };

        if (filters.resourceId) where.resource_id = filters.resourceId;
        if (filters.status) where.status = filters.status;
        if (filters.startDate && filters.endDate) {
            where[Op.or] = [
                {
                    start_date: { [Op.between]: [filters.startDate, filters.endDate] }
                },
                {
                    end_date: { [Op.between]: [filters.startDate, filters.endDate] }
                }
            ];
        }

        const total = await BookingModel.count({ where });
        const limit = filters.limit || 20;
        const offset = filters.offset || 0;

        const bookings = await BookingModel.findAll({
            where,
            limit,
            offset,
            order: [['start_date', 'DESC']]
        });

        return {
            bookings: bookings.map(toEntity),
            total,
        };
    }

    async count(tenantId: string, filters?: BookingFilters): Promise<number> {
        const { total } = await this.findAll(tenantId, { ...filters, limit: 1, offset: 0 });
        return total;
    }

    async countOverlapping(resourceId: string, startDate: Date, endDate: Date, excludeId?: string): Promise<number> {
        const where: any = {
            resource_id: resourceId,
            status: { [Op.notIn]: ['cancelled', 'no_show'] },
            [Op.or]: [
                {
                    start_date: { [Op.lt]: endDate },
                    end_date: { [Op.gt]: startDate }
                }
            ]
        };

        if (excludeId) {
            where.id = { [Op.ne]: excludeId };
        }

        return await BookingModel.count({ where });
    }

    async update(booking: BookingEntity): Promise<BookingEntity> {
        return this.save(booking);
    }

    async findByExternalRef(sourcePlatform: string, externalRef: string, tenantId: string): Promise<BookingEntity | null> {
        const booking = await BookingModel.findOne({
            where: { source_platform: sourcePlatform, external_ref: externalRef, tenant_id: tenantId }
        });
        return booking ? toEntity(booking) : null;
    }

    async delete(id: string, tenantId: string): Promise<void> {
        await BookingModel.update(
            { status: 'cancelled' },
            { where: { id, tenant_id: tenantId } }
        );
    }

    async updateStatus(id: string, status: BookingStatus, tenantId: string): Promise<BookingEntity | null> {
        const [affectedCount] = await BookingModel.update(
            { status },
            { where: { id, tenant_id: tenantId } }
        );

        if (affectedCount === 0) return null;

        const updated = await BookingModel.findOne({ where: { id, tenant_id: tenantId } });
        return updated ? toEntity(updated) : null;
    }
}
