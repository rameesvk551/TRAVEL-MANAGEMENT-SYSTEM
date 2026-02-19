import { Request, Response, NextFunction } from 'express';
import { CampaignService } from './campaign.service.js';
import { RequestContext } from '../../shared/types/index.js';

export class CampaignController {
    constructor(private campaignService: CampaignService) { }

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = req.context as RequestContext;
            const campaign = await this.campaignService.createCampaign({
                ...req.body,
                tenantId: context.tenantId
            });
            res.status(201).json(campaign);
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = req.context as RequestContext;
            const id = req.params.id;
            const campaign = await this.campaignService.updateCampaign(id, context.tenantId, req.body);
            res.status(200).json(campaign);
        } catch (error) {
            next(error);
        }
    };

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = req.context as RequestContext;
            const result = await this.campaignService.getCampaigns(context.tenantId, {
                ...req.query,
                limit: req.query.limit ? Number(req.query.limit) : 20,
                offset: req.query.offset ? Number(req.query.offset) : 0
            });
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = req.context as RequestContext;
            const id = req.params.id;
            const campaign = await this.campaignService.getCampaignById(id, context.tenantId);
            if (!campaign) {
                res.status(404).json({ message: 'Campaign not found' });
                return;
            }
            res.status(200).json(campaign);
        } catch (error) {
            next(error);
        }
    };

    launch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = req.context as RequestContext;
            const id = req.params.id;
            await this.campaignService.launchCampaign(id, context.tenantId);
            res.status(200).json({ message: 'Campaign launched successfully' });
        } catch (error) {
            next(error);
        }
    };

    delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = req.context as RequestContext;
            const id = req.params.id;
            await this.campaignService.deleteCampaign(id, context.tenantId);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };
}
