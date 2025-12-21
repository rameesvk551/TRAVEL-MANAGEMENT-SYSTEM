import { Router, RequestHandler } from 'express';
import { InventoryController } from '../controllers/InventoryController.js';
import { InventoryService } from '../../application/services/InventoryService.js';
import { HoldService } from '../../application/services/HoldService.js';
import { BookingOrchestrator } from '../../application/services/BookingOrchestrator.js';
import { DepartureRepository } from '../../infrastructure/repositories/DepartureRepository.js';
import { BookingRepository } from '../../infrastructure/repositories/BookingRepository.js';
import { PaymentRepository } from '../../infrastructure/repositories/PaymentRepository.js';

export function createInventoryRoutes(authMiddleware: RequestHandler): Router {
  const router = Router();

  // Initialize dependencies
  const departureRepo = new DepartureRepository();
  const bookingRepo = new BookingRepository();
  const paymentRepo = new PaymentRepository();
  
  const inventoryService = new InventoryService(departureRepo);
  const holdService = new HoldService(departureRepo);
  
  // BookingOrchestrator requires all 5 dependencies in correct order
  const bookingOrchestrator = new BookingOrchestrator(
    bookingRepo,       // IBookingRepository
    departureRepo,     // IDepartureRepository
    paymentRepo,       // IPaymentRepository
    inventoryService,  // InventoryService
    holdService        // HoldService
  );

  const controller = new InventoryController(
    inventoryService,
    holdService,
    bookingOrchestrator
  );

  // All routes require authentication
  router.use(authMiddleware);

  // Departure routes
  router.get('/departures', controller.getDepartures);
  router.get('/departures/:id', controller.getDepartureById);
  router.post('/departures', controller.createDeparture);

  // Departure-specific holds (frontend expects /departures/:id/holds)
  router.get('/departures/:departureId/holds', controller.getActiveHolds);
  router.post('/departures/:departureId/holds', controller.createHoldForDeparture);

  // Calendar & Stats
  router.get('/calendar', controller.getCalendar);
  router.get('/stats', controller.getStats);

  // Hold routes (generic)
  router.post('/holds', controller.createHold);
  router.delete('/holds/:holdId', controller.releaseHold);
  router.patch('/holds/:holdId/extend', controller.extendHold);

  // Booking routes
  router.post('/bookings', controller.initiateBooking);
  router.post('/bookings/:holdId/confirm', controller.confirmBooking);
  router.delete('/bookings/:bookingId', controller.cancelBooking);

  return router;
}
