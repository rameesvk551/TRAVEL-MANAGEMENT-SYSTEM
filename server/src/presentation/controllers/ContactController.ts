import { Request, Response, NextFunction } from 'express';
import { ContactService } from '../../application/services/ContactService.js';
import { RequestContext } from '../../shared/types/index.js';

export class ContactController {
    constructor(private contactService: ContactService) { }

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = req.context as RequestContext;
            const contact = await this.contactService.createOrUpdateContact({
                ...req.body,
                tenantId: context.tenantId
            });
            res.status(201).json(contact);
        } catch (error) {
            next(error);
        }
    };

    getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const context = req.context as RequestContext;
            const result = await this.contactService.getContacts(context.tenantId, {
                ...req.query,
                limit: req.query.limit ? Number(req.query.limit) : 20,
                offset: req.query.offset ? Number(req.query.offset) : 0,
                page: req.query.page ? Number(req.query.page) : 1
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
            const contact = await this.contactService.getContact(id, context.tenantId);
            if (!contact) {
                res.status(404).json({ message: 'Contact not found' });
                return;
            }
            res.status(200).json(contact);
        } catch (error) {
            next(error);
        }
    }
}
