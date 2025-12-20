import { Router, RequestHandler } from 'express';
import { LeadController } from '../controllers/LeadController.js';
import { ContactController } from '../controllers/ContactController.js';
import { ActivityController } from '../controllers/ActivityController.js';
import { PipelineController } from '../controllers/PipelineController.js';

import { LeadService } from '../../application/services/LeadService.js';
import { ContactService } from '../../application/services/ContactService.js';
import { ActivityService } from '../../application/services/ActivityService.js';
import { PipelineService } from '../../application/services/PipelineService.js';

import { LeadRepository } from '../../infrastructure/repositories/LeadRepository.js';
import { ContactRepository } from '../../infrastructure/repositories/ContactRepository.js';
import { ActivityRepository } from '../../infrastructure/repositories/ActivityRepository.js';
import { PipelineRepository } from '../../infrastructure/repositories/PipelineRepository.js';

import { BookingService } from '../../application/services/BookingService.js';
import { AvailabilityService } from '../../application/services/AvailabilityService.js';
import { BookingRepository } from '../../infrastructure/repositories/BookingRepository.js';
import { ResourceRepository } from '../../infrastructure/repositories/ResourceRepository.js';

// ... imports
// Dependency Injection Setup (Manual for now, typically IOC container)
const leadRepo = new LeadRepository();
const contactRepo = new ContactRepository();
const activityRepo = new ActivityRepository();
const pipelineRepo = new PipelineRepository();
const bookingRepo = new BookingRepository(); // New
const resourceRepo = new ResourceRepository(); // New

const contactService = new ContactService(contactRepo);
const pipelineService = new PipelineService(pipelineRepo);
const availabilityService = new AvailabilityService(bookingRepo, resourceRepo);

const bookingService = new BookingService(bookingRepo, availabilityService);

const leadService = new LeadService(leadRepo, contactService, pipelineService, bookingService);
const activityService = new ActivityService(activityRepo);

const leadController = new LeadController(leadService);
const contactController = new ContactController(contactService);
const activityController = new ActivityController(activityService);
const pipelineController = new PipelineController(pipelineService);

export function createCrmRoutes(authMiddleware: RequestHandler): Router {
    const router = Router();

    router.use(authMiddleware); // ALL CRM routes require auth

    // Leads
    router.post('/leads', leadController.create);
    router.get('/leads', leadController.getAll);
    router.get('/leads/pipeline/:pipelineId', leadController.getBoard);
    router.patch('/leads/:id', leadController.update);
    router.patch('/leads/:id/stage', leadController.moveStage);
    router.post('/leads/:id/convert', leadController.convert);

    // Contacts
    router.post('/contacts', contactController.create);
    router.get('/contacts', contactController.getAll);
    router.get('/contacts/:id', contactController.getById);

    // Activities
    router.post('/activities', activityController.log);
    router.get('/activities', activityController.getAll);

    // Pipelines
    router.get('/pipelines', pipelineController.getAll);

    return router;
}

