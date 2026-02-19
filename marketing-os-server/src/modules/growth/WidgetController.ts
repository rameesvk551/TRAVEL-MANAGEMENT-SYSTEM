import { Request, Response } from 'express';
import { WidgetService } from '../modules/growth';

export class WidgetController {
    constructor(private widgetService: WidgetService) { }

    create = async (req: Request, res: Response) => {
        try {
            const widget = await this.widgetService.createWidget(req.context.tenantId, req.body);
            res.status(201).json(widget);
        } catch (error) {
            res.status(500).json({ error: 'Failed to create widget' });
        }
    };

    update = async (req: Request, res: Response) => {
        try {
            const widget = await this.widgetService.updateWidget(req.context.tenantId, req.params.id, req.body);
            if (!widget) return res.status(404).json({ error: 'Widget not found' });
            res.json(widget);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update widget' });
        }
    };

    delete = async (req: Request, res: Response) => {
        try {
            const success = await this.widgetService.deleteWidget(req.context.tenantId, req.params.id);
            if (!success) return res.status(404).json({ error: 'Widget not found' });
            res.json({ message: 'Widget deleted' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete widget' });
        }
    };

    getAll = async (req: Request, res: Response) => {
        try {
            const widgets = await this.widgetService.getWidgets(req.context.tenantId);
            res.json(widgets);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch widgets' });
        }
    };

    getOne = async (req: Request, res: Response) => {
        try {
            const widget = await this.widgetService.getWidgetById(req.context.tenantId, req.params.id);
            if (!widget) return res.status(404).json({ error: 'Widget not found' });
            res.json(widget);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch widget' });
        }
    };

    // Public endpoint for the script
    getPublicConfig = async (req: Request, res: Response) => {
        try {
            const widget = await this.widgetService.getPublicConfig(req.params.id);
            if (!widget) return res.status(404).json({ error: 'Widget not found' });

            // Return only public config
            res.json({
                name: widget.name,
                config: widget.config,
                isActive: widget.isActive
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch widget config' });
        }
    };

    trackClick = async (req: Request, res: Response) => {
        try {
            // How do we get tenantId here? It's public.
            // Ideally passing tenantId in query or params.
            // Or we fetch it from widget first.

            // For now, assume widget ID is enough to find it (and tenantId is in the doc).
            // But service.trackClick needs tenantId for the event.
            // We can fetch the widget to get the tenantId.
            // Ideally optimize this.

            const widget = await this.widgetService.getPublicConfig(req.params.id); // Re-using getPublicConfig to find & check
            if (widget) {
                await this.widgetService.trackClick(widget.tenantId, req.params.id);
                res.json({ success: true });
            } else {
                res.status(404).json({ error: 'Widget not found' });
            }

        } catch (error) {
            res.status(500).json({ error: 'Failed to track click' });
        }
    }
}
