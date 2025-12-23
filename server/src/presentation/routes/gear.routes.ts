import { Router, RequestHandler } from 'express';
import { GearCategoryController } from '../controllers/gear/GearCategoryController.js';
import { GearItemController } from '../controllers/gear/GearItemController.js';
import { GearAssignmentController } from '../controllers/gear/GearAssignmentController.js';
import { GearInventoryController } from '../controllers/gear/GearInventoryController.js';
import { GearCategoryService } from '../../application/services/gear/GearCategoryService.js';
import { GearItemService } from '../../application/services/gear/GearItemService.js';
import { GearAssignmentService } from '../../application/services/gear/GearAssignmentService.js';
import { GearInventoryService } from '../../application/services/gear/GearInventoryService.js';
import { GearCategoryRepository } from '../../infrastructure/repositories/gear/GearCategoryRepository.js';
import { GearItemRepository } from '../../infrastructure/repositories/gear/GearItemRepository.js';
import { GearInventoryRepository } from '../../infrastructure/repositories/gear/GearInventoryRepository.js';
import { GearAssignmentRepository } from '../../infrastructure/repositories/gear/GearAssignmentRepository.js';

export function createGearRoutes(authMiddleware: RequestHandler): Router {
    const router = Router();

    // Initialize repositories
    const categoryRepository = new GearCategoryRepository();
    const itemRepository = new GearItemRepository();
    const inventoryRepository = new GearInventoryRepository();
    const assignmentRepository = new GearAssignmentRepository();

    // Initialize services
    const categoryService = new GearCategoryService(categoryRepository);
    const itemService = new GearItemService(itemRepository, inventoryRepository, categoryRepository);
    const assignmentService = new GearAssignmentService(assignmentRepository, inventoryRepository, itemRepository);
    const inventoryService = new GearInventoryService(inventoryRepository, itemRepository, categoryRepository);

    // Initialize controllers
    const categoryController = new GearCategoryController(categoryService);
    const itemController = new GearItemController(itemService);
    const assignmentController = new GearAssignmentController(assignmentService);
    const inventoryController = new GearInventoryController(inventoryService);

    // Apply auth middleware to all routes
    router.use(authMiddleware);

    // ============================================
    // CATEGORY ROUTES
    // ============================================
    router.get('/categories', categoryController.getAll);
    router.get('/categories/:id', categoryController.getById);
    router.post('/categories', categoryController.create);
    router.put('/categories/:id', categoryController.update);
    router.delete('/categories/:id', categoryController.delete);

    // ============================================
    // ITEM ROUTES
    // ============================================
    router.get('/items', itemController.getAll);
    router.get('/items/unsafe', itemController.getUnsafe);
    router.get('/items/inspection-overdue', itemController.getInspectionOverdue);
    router.get('/items/maintenance-overdue', itemController.getMaintenanceOverdue);
    router.get('/items/:id', itemController.getById);
    router.get('/items/barcode/:barcode', itemController.getByBarcode);
    router.post('/items', itemController.create);
    router.put('/items/:id', itemController.update);
    router.patch('/items/:id/condition', itemController.updateCondition);
    router.post('/items/:id/retire', itemController.retire);

    // ============================================
    // INVENTORY ROUTES
    // ============================================
    router.get('/inventory/summary', inventoryController.getSummary);
    router.get('/inventory/availability', inventoryController.checkAvailability);
    router.get('/inventory/heatmap', inventoryController.getHeatmap);
    router.post('/inventory/transfer', inventoryController.transfer);
    router.post('/inventory/:id/release-quarantine', inventoryController.releaseFromQuarantine);
    router.post('/inventory/release-expired', inventoryController.releaseExpiredReservations);

    // ============================================
    // ASSIGNMENT ROUTES
    // ============================================
    router.get('/assignments/pending-returns', assignmentController.getPendingReturns);
    router.get('/assignments/overdue', assignmentController.getOverdueReturns);
    router.get('/assignments/trip/:tripId', assignmentController.getByTrip);
    router.get('/assignments/trip/:tripId/manifest', assignmentController.getTripManifest);
    router.post('/assignments', assignmentController.create);
    router.post('/assignments/bulk', assignmentController.createBulk);
    router.post('/assignments/:id/issue', assignmentController.issueGear);
    router.post('/assignments/:id/return', assignmentController.returnGear);
    router.post('/assignments/:id/cancel', assignmentController.cancel);

    return router;
}
