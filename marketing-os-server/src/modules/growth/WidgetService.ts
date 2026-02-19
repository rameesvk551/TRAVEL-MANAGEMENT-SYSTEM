import { WidgetModel, IWidget } from '../../../infrastructure/database/mongo/models/Widget.js';
import { AnalyticsEventModel } from '../../../infrastructure/database/mongo/models/AnalyticsEvent.js';

export class WidgetService {

    async createWidget(tenantId: string, data: Partial<IWidget>): Promise<IWidget> {
        const widget = await WidgetModel.create({
            ...data,
            tenantId,
            stats: { impressions: 0, clicks: 0, conversions: 0 }
        });
        return widget;
    }

    async updateWidget(tenantId: string, id: string, data: Partial<IWidget>): Promise<IWidget | null> {
        return WidgetModel.findOneAndUpdate(
            { _id: id, tenantId },
            { $set: data },
            { new: true }
        );
    }

    async deleteWidget(tenantId: string, id: string): Promise<boolean> {
        const result = await WidgetModel.deleteOne({ _id: id, tenantId });
        return result.deletedCount === 1;
    }

    async getWidgets(tenantId: string): Promise<IWidget[]> {
        return WidgetModel.find({ tenantId }).sort({ createdAt: -1 });
    }

    async getWidgetById(tenantId: string, id: string): Promise<IWidget | null> {
        return WidgetModel.findOne({ _id: id, tenantId });
    }

    async findById(id: string): Promise<IWidget | null> {
        return WidgetModel.findById(id);
    }

    // Public method for the widget script to load config
    async getPublicConfig(id: string): Promise<IWidget | null> {
        const widget = await this.findById(id);
        if (!widget || !widget.isActive) return null;

        // Track impression (async, don't await)
        this.trackImpression(widget.tenantId, id);

        return widget;
    }

    async trackImpression(tenantId: string, widgetId: string) {
        // Increment stats
        await WidgetModel.findByIdAndUpdate(widgetId, { $inc: { 'stats.impressions': 1 } });

        // Log event
        await AnalyticsEventModel.create({
            tenantId,
            eventType: 'widget_impression',
            source: 'widget',
            metadata: { widgetId }
        });
    }

    async trackClick(tenantId: string, widgetId: string) {
        await WidgetModel.findByIdAndUpdate(widgetId, { $inc: { 'stats.clicks': 1 } });

        await AnalyticsEventModel.create({
            tenantId,
            eventType: 'widget_click',
            source: 'widget',
            metadata: { widgetId }
        });
    }
}
