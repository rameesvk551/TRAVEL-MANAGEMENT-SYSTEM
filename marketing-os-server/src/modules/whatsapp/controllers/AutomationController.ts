// presentation/controllers/whatsapp/AutomationController.ts

export function createAutomationController(automationEngine: any) {
    const getRules = async (req: any, res: any, next: any) => {
        try { const tenantId = req.context?.tenantId || 'default'; const rules = await automationEngine.getRules(tenantId); res.json({ data: rules }); } catch (error) { next(error); }
    };
    const createRule = async (req: any, res: any, next: any) => {
        try { const tenantId = req.context?.tenantId || 'default'; const rule = await automationEngine.createRule(tenantId, req.body); res.status(201).json({ data: rule }); } catch (error) { next(error); }
    };
    const updateRule = async (req: any, res: any, next: any) => {
        try { const tenantId = req.context?.tenantId || 'default'; const { id } = req.params; const rule = await automationEngine.updateRule(tenantId, id, req.body); if (!rule) { res.status(404).json({ error: 'Rule not found' }); return; } res.json({ data: rule }); } catch (error) { next(error); }
    };
    const deleteRule = async (req: any, res: any, next: any) => {
        try { const tenantId = req.context?.tenantId || 'default'; const { id } = req.params; const success = await automationEngine.deleteRule(tenantId, id); if (!success) { res.status(404).json({ error: 'Rule not found' }); return; } res.json({ success: true }); } catch (error) { next(error); }
    };
    return { getRules, createRule, updateRule, deleteRule };
}
