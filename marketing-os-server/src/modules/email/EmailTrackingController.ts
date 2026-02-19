
import { Request, Response } from 'express';
import { EmailTrackingService } from './EmailTrackingService.js';

export class EmailTrackingController {
    constructor(private trackingService: EmailTrackingService) { }

    trackOpen = async (req: Request, res: Response) => {
        try {
            const { campaignId, recipientId } = req.params;
            const tenantId = req.query.tenantId as string;
            const userAgent = req.headers['user-agent'] || '';
            const ip = req.ip || '';

            if (tenantId) {
                await this.trackingService.trackOpen(tenantId, campaignId, recipientId, userAgent, ip);
            }

            // Return 1x1 transparent GIF
            const img = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
            res.writeHead(200, {
                'Content-Type': 'image/gif',
                'Content-Length': img.length,
            });
            res.end(img);
        } catch (error) {
            console.error('Error tracking open:', error);
            // Return 1x1 transparent GIF even on error to avoid breaking email UI
            const img = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
            res.writeHead(200, {
                'Content-Type': 'image/gif',
                'Content-Length': img.length,
            });
            res.end(img);
        }
    };

    trackClick = async (req: Request, res: Response) => {
        try {
            const { campaignId, recipientId } = req.params;
            const targetUrl = req.query.url as string;
            const tenantId = req.query.tenantId as string;
            const userAgent = req.headers['user-agent'] || '';
            const ip = req.ip || '';

            if (tenantId && targetUrl) {
                await this.trackingService.trackClick(tenantId, campaignId, recipientId, targetUrl, userAgent, ip);
            }

            if (targetUrl) {
                res.redirect(targetUrl);
            } else {
                res.status(400).send('Missing target URL');
            }
        } catch (error) {
            console.error('Error tracking click:', error);
            const targetUrl = req.query.url as string;
            if (targetUrl) {
                res.redirect(targetUrl);
            } else {
                res.status(500).send('Error processing click');
            }
        }
    };
}
