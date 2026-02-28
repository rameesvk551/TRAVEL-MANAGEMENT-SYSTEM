// presentation/controllers/whatsapp/WhatsAppAnalyticsController.ts

export function createWhatsAppAnalyticsController(analyticsService: any) {
    const getCampaignStats = async (req: any, res: any) => {
        try { const { tenantId } = req; const { start, end } = req.query; const stats = await analyticsService.getCampaignStats(tenantId, start ? new Date(start as string) : undefined, end ? new Date(end as string) : undefined); res.json(stats); } catch (error) { console.error('Error fetching campaign stats:', error); res.status(500).json({ error: 'Failed to fetch campaign stats' }); }
    };
    const getResponseStats = async (req: any, res: any) => { res.json({ avgResponseTimeMinutes: 12, resolutionRate: 92 }); };
    return { getCampaignStats, getResponseStats };
}
