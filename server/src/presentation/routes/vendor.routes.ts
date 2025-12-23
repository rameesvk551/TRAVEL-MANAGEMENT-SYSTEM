import { Router, RequestHandler } from 'express';
import { VendorController, VendorAssignmentController, VendorPayableController, VendorSettlementController } from '../controllers/vendor/index.js';
import { VendorService, VendorAssignmentService, VendorPayableService, VendorSettlementService } from '../../application/services/vendor/index.js';
import { VendorRepository, VendorAssignmentRepository, VendorPayableRepository, VendorSettlementRepository } from '../../infrastructure/repositories/vendor/index.js';

export function createVendorRoutes(authMiddleware: RequestHandler): Router {
    const router = Router();

    // Initialize repositories
    const vendorRepository = new VendorRepository();
    const assignmentRepository = new VendorAssignmentRepository();
    const payableRepository = new VendorPayableRepository();
    const settlementRepository = new VendorSettlementRepository();

    // Initialize services
    const vendorService = new VendorService(vendorRepository);
    const assignmentService = new VendorAssignmentService(assignmentRepository, vendorRepository, payableRepository);
    const payableService = new VendorPayableService(payableRepository);
    const settlementService = new VendorSettlementService(settlementRepository, payableRepository, vendorRepository);

    // Initialize controllers
    const vendorController = new VendorController(vendorService);
    const assignmentController = new VendorAssignmentController(assignmentService);
    const payableController = new VendorPayableController(payableService);
    const settlementController = new VendorSettlementController(settlementService);

    // Apply auth middleware to all routes
    router.use(authMiddleware);

    // ============================================================
    // VENDOR ROUTES
    // ============================================================
    router.get('/vendors', vendorController.getAll);
    router.get('/vendors/active', vendorController.getActive);
    router.get('/vendors/search', vendorController.search);
    router.get('/vendors/type/:type', vendorController.getByType);
    router.get('/vendors/:id', vendorController.getById);
    router.post('/vendors', vendorController.create);
    router.put('/vendors/:id', vendorController.update);
    router.patch('/vendors/:id/status', vendorController.updateStatus);
    router.post('/vendors/:id/activate', vendorController.activate);
    router.post('/vendors/:id/deactivate', vendorController.deactivate);

    // ============================================================
    // ASSIGNMENT ROUTES
    // ============================================================
    router.get('/assignments', assignmentController.getAll);
    router.get('/assignments/upcoming', assignmentController.getUpcoming);
    router.get('/assignments/vendor/:vendorId', assignmentController.getByVendor);
    router.get('/assignments/booking/:bookingId', assignmentController.getByBooking);
    router.get('/assignments/:id', assignmentController.getById);
    router.post('/assignments', assignmentController.create);
    router.put('/assignments/:id', assignmentController.update);
    router.post('/assignments/:id/accept', assignmentController.accept);
    router.post('/assignments/:id/complete', assignmentController.complete);
    router.post('/assignments/:id/cancel', assignmentController.cancel);
    router.post('/assignments/:id/replace', assignmentController.replace);

    // ============================================================
    // PAYABLE ROUTES
    // ============================================================
    router.get('/payables', payableController.getAll);
    router.get('/payables/summary', payableController.getSummary);
    router.get('/payables/overdue', payableController.getOverdue);
    router.get('/payables/vendor/:vendorId', payableController.getByVendor);
    router.get('/payables/vendor/:vendorId/summary', payableController.getVendorSummary);
    router.get('/payables/:id', payableController.getById);
    router.post('/payables', payableController.create);
    router.put('/payables/:id', payableController.update);
    router.post('/payables/:id/submit', payableController.submit);
    router.post('/payables/:id/approve', payableController.approve);
    router.post('/payables/:id/hold', payableController.hold);
    router.post('/payables/:id/dispute', payableController.dispute);

    // ============================================================
    // SETTLEMENT ROUTES
    // ============================================================
    router.get('/settlements', settlementController.getAll);
    router.get('/settlements/summary', settlementController.getSummary);
    router.get('/settlements/vendor/:vendorId', settlementController.getByVendor);
    router.get('/settlements/vendor/:vendorId/summary', settlementController.getVendorSummary);
    router.get('/settlements/:id', settlementController.getById);
    router.post('/settlements', settlementController.create);
    router.post('/settlements/:id/verify', settlementController.verify);

    return router;
}
