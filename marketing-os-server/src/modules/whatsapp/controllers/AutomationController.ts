// presentation/controllers/whatsapp/AutomationController.ts

export class AutomationController {
    constructor(private automationEngine: any) { }

    getRules = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId || 'default';
            const rules = await this.automationEngine.getRules(tenantId);
            res.json({ data: rules });
        } catch (error) { next(error); }
    };

    createRule = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId || 'default';
            const rule = await this.automationEngine.createRule(tenantId, req.body);
            res.status(201).json({ data: rule });
        } catch (error) { next(error); }
    };

    updateRule = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId || 'default';
            const { id } = req.params;
            const rule = await this.automationEngine.updateRule(tenantId, id, req.body);
            if (!rule) { res.status(404).json({ error: 'Rule not found' }); return; }
            res.json({ data: rule });
        } catch (error) { next(error); }
    };

    deleteRule = async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId || 'default';
            const { id } = req.params;
            const success = await this.automationEngine.deleteRule(tenantId, id);
            if (!success) { res.status(404).json({ error: 'Rule not found' }); return; }
            res.json({ success: true });
        } catch (error) { next(error); }
    };
}
