import { Request, Response } from 'express';
import { FlowService } from './flow.service.js';
import { MongoFlowRepository } from '../../infrastructure/repositories/mongo/MongoFlowRepository.js';

// Basic dependency injection manually for now, or use container if available
const flowRepository = new MongoFlowRepository();
const flowService = new FlowService(flowRepository);

export class FlowController {
    // constructor(private flowService: FlowService) {} // If using DI container

    async createFlow(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user?.tenantId; // Assuming Auth Middleware attaches user
            if (!tenantId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            const flow = await flowService.createFlow(tenantId, req.body);
            res.status(201).json({ success: true, data: flow });
        } catch (error) {
            console.error('Error creating flow:', error);
            res.status(500).json({ success: false, error: 'Failed to create flow' });
        }
    }

    async getFlows(req: Request, res: Response) {
        try {
            const tenantId = (req as any).user?.tenantId;
            if (!tenantId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            const flows = await flowService.getFlows(tenantId);
            res.status(200).json({ success: true, data: flows });
        } catch (error) {
            console.error('Error fetching flows:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch flows' });
        }
    }

    async getFlow(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const flow = await flowService.getFlow(id);

            if (!flow) {
                return res.status(404).json({ success: false, error: 'Flow not found' });
            }

            // Optional: Check tenant ownership
            const tenantId = (req as any).user?.tenantId;
            if (flow.tenantId !== tenantId) {
                return res.status(403).json({ success: false, error: 'Forbidden' });
            }

            res.status(200).json({ success: true, data: flow });
        } catch (error) {
            console.error('Error fetching flow:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch flow' });
        }
    }

    async updateFlow(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const flow = await flowService.updateFlow(id, req.body);
            if (!flow) {
                return res.status(404).json({ success: false, error: 'Flow not found' });
            }
            res.status(200).json({ success: true, data: flow });
        } catch (error) {
            console.error('Error updating flow:', error);
            res.status(500).json({ success: false, error: 'Failed to update flow' });
        }
    }

    async deleteFlow(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const success = await flowService.deleteFlow(id);
            if (!success) {
                return res.status(404).json({ success: false, error: 'Flow not found' });
            }
            res.status(200).json({ success: true, message: 'Flow deleted successfully' });
        } catch (error) {
            console.error('Error deleting flow:', error);
            res.status(500).json({ success: false, error: 'Failed to delete flow' });
        }
    }
}
