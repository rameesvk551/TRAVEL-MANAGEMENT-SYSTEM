import { Router, RequestHandler } from 'express';
import { TrackingController } from './controllers/TrackingController.js';
import { AnalyticsController } from './controllers/AnalyticsController.js';
import { IntegrationController } from './controllers/IntegrationController.js';
import { FunnelController } from './controllers/FunnelController.js';
import { WidgetController } from './controllers/WidgetController.js';

export function createGrowthRoutes(
    authMiddleware: RequestHandler,
    trackingController: TrackingController,
    analyticsController: AnalyticsController,
    integrationController: IntegrationController,
    funnelController: FunnelController,
    widgetController: WidgetController,
): Router {
    const router = Router();

    // Public routes (no auth for tracking pixel and event ingestion)
    router.get('/pixel.js', trackingController.servePixelScript);
    router.post('/track', trackingController.ingestEvent);

    // Protected routes
    router.use(authMiddleware);

    // Real-time
    router.get('/realtime', trackingController.getRealtimeCount);
    router.get('/realtime/visitors', trackingController.getRealtimeVisitors);
    router.get('/visitors/:visitorId/timeline', trackingController.getVisitorTimeline);

    // Analytics
    router.get('/analytics/overview', analyticsController.getOverview);
    router.get('/analytics/sources', analyticsController.getSources);
    router.get('/analytics/utm', analyticsController.getUTM);
    router.get('/analytics/geo', analyticsController.getGeo);
    router.get('/analytics/devices', analyticsController.getDevices);
    router.get('/analytics/landing-pages', analyticsController.getLandingPages);
    router.get('/analytics/cost-metrics', analyticsController.getCostMetrics);
    router.get('/analytics/conversions', analyticsController.getConversions);
    router.get('/analytics/conversions/trend', analyticsController.getConversionTrend);
    router.get('/analytics/attribution', analyticsController.getAttribution);
    router.get('/analytics/campaigns/:id/performance', analyticsController.getCampaignPerformance);
    router.get('/analytics/ad-creatives', analyticsController.getAdCreativePerformance);
    router.get('/analytics/spend-trend', analyticsController.getSpendTrend);

    // Record conversion
    router.post('/conversions', analyticsController.recordConversion);

    // Integrations
    router.get('/integrations/status', integrationController.getStatus);
    router.get('/integrations/credentials', integrationController.getCredentials);
    router.put('/integrations/credentials/:platform', integrationController.upsertCredentials);
    router.post('/integrations/sync-costs', integrationController.syncCosts);
    router.post('/integrations/test', integrationController.testConnection);
    router.get('/integrations/meta/audience', integrationController.getMetaAudience);
    router.get('/integrations/google/keywords', integrationController.getGoogleKeywords);
    router.get('/integrations/google/search-terms', integrationController.getGoogleSearchTerms);
    router.get('/integrations/google/ga4/behavior', integrationController.getGa4Behavior);
    router.get('/integrations/google/ga4/funnels', integrationController.getGa4Funnels);

    // Funnels
    router.post('/funnels', funnelController.create);
    router.get('/funnels', funnelController.list);
    router.get('/funnels/:id', funnelController.getById);
    router.put('/funnels/:id', funnelController.update);
    router.delete('/funnels/:id', funnelController.remove);
    router.get('/funnels/:id/analyze', funnelController.analyze);

    // Widgets
    router.post('/widgets', widgetController.create);
    router.get('/widgets', widgetController.getAll);
    router.get('/widgets/:id', widgetController.getOne);
    router.put('/widgets/:id', widgetController.update);
    router.delete('/widgets/:id', widgetController.delete);
    router.get('/widgets/:id/config', widgetController.getPublicConfig);

    return router;
}
