import { Op, fn, col, literal } from 'sequelize';
import { sequelize } from '../../config/database.js';
import { Conversion } from '../modules/growth/models/Conversion';
import { IConversionRepository, ConversionFilters } from '../modules/growth/interfaces/IConversionRepository';
import { ConversionModel } from '../models/ConversionModel.js';

export class SequelizeConversionRepository implements IConversionRepository {
    async save(conversion: Conversion): Promise<Conversion> {
        const instance = await ConversionModel.create({
            id: conversion.id,
            tenantId: conversion.tenantId,
            visitorId: conversion.visitorId,
            eventId: conversion.eventId,
            sourceId: conversion.sourceId,
            campaignId: conversion.campaignId,
            conversionType: conversion.conversionType,
            conversionValue: conversion.conversionValue,
            currency: conversion.currency,
            landingPage: conversion.landingPage,
            attributionModel: conversion.attributionModel,
            attributionData: conversion.attributionData,
            properties: conversion.properties,
        });
        return instance.toEntity();
    }

    async findAll(tenantId: string, filters?: ConversionFilters): Promise<{ conversions: Conversion[]; total: number }> {
        const where: any = { tenantId };
        if (filters?.conversionType) where.conversionType = filters.conversionType;
        if (filters?.campaignId) where.campaignId = filters.campaignId;
        if (filters?.startDate || filters?.endDate) {
            where.createdAt = {};
            if (filters?.startDate) where.createdAt[Op.gte] = filters.startDate;
            if (filters?.endDate) where.createdAt[Op.lte] = filters.endDate;
        }

        const total = await ConversionModel.count({ where });
        const models = await ConversionModel.findAll({
            where,
            limit: filters?.limit || 50,
            offset: filters?.offset || 0,
            order: [['createdAt', 'DESC']],
        });

        return { conversions: models.map(m => m.toEntity()), total };
    }

    async countByType(tenantId: string, start: Date, end: Date): Promise<Array<{ conversionType: string; count: number; totalValue: number }>> {
        const results = await ConversionModel.findAll({
            attributes: [
                'conversionType',
                [fn('COUNT', col('id')), 'count'],
                [fn('SUM', col('conversion_value')), 'totalValue'],
            ],
            where: { tenantId, createdAt: { [Op.between]: [start, end] } },
            group: ['conversionType'],
            order: [[literal('count'), 'DESC']],
            raw: true,
        });
        return results.map((r: any) => ({
            conversionType: r.conversionType,
            count: parseInt(r.count, 10),
            totalValue: parseFloat(r.totalValue) || 0,
        }));
    }

    async countByCampaign(tenantId: string, start: Date, end: Date): Promise<Array<{ campaignId: string; count: number; totalValue: number }>> {
        const results = await ConversionModel.findAll({
            attributes: [
                'campaignId',
                [fn('COUNT', col('id')), 'count'],
                [fn('SUM', col('conversion_value')), 'totalValue'],
            ],
            where: {
                tenantId,
                createdAt: { [Op.between]: [start, end] },
                campaignId: { [Op.ne]: null },
            } as any,
            group: ['campaignId'],
            order: [[literal('count'), 'DESC']],
            raw: true,
        });
        return results.map((r: any) => ({
            campaignId: r.campaignId,
            count: parseInt(r.count, 10),
            totalValue: parseFloat(r.totalValue) || 0,
        }));
    }

    async getConversionTrend(tenantId: string, start: Date, end: Date, interval: 'day' | 'week' | 'month'): Promise<Array<{ date: string; count: number; value: number }>> {
        const truncFn = interval === 'day' ? 'day' : interval === 'week' ? 'week' : 'month';
        const results = await sequelize.query(
            `SELECT date_trunc(:interval, created_at) as date, 
                    COUNT(*)::int as count, 
                    COALESCE(SUM(conversion_value), 0)::float as value
             FROM tracking_conversions 
             WHERE tenant_id = :tenantId AND created_at BETWEEN :start AND :end
             GROUP BY date_trunc(:interval, created_at) 
             ORDER BY date ASC`,
            {
                replacements: { tenantId, start, end, interval: truncFn },
                type: 'SELECT' as any,
            }
        );
        return (results as any[]).map(r => ({
            date: r.date,
            count: parseInt(r.count, 10),
            value: parseFloat(r.value) || 0,
        }));
    }

    async getTotalValue(tenantId: string, start: Date, end: Date): Promise<number> {
        const result = await ConversionModel.findOne({
            attributes: [[fn('SUM', col('conversion_value')), 'totalValue']],
            where: { tenantId, createdAt: { [Op.between]: [start, end] } },
            raw: true,
        });
        return parseFloat((result as any)?.totalValue) || 0;
    }

    async getTotalCount(tenantId: string, start: Date, end: Date): Promise<number> {
        return ConversionModel.count({
            where: { tenantId, createdAt: { [Op.between]: [start, end] } },
        });
    }
}
