import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../../application/services/InventoryService.js';
import { HoldService } from '../../application/services/HoldService.js';
import { BookingOrchestrator } from '../../application/services/BookingOrchestrator.js';
import { AppError } from '../../shared/errors/AppError.js';
import { HoldType } from '../../domain/entities/InventoryHold.js';

export class InventoryController {
  constructor(
    private inventoryService: InventoryService,
    private holdService: HoldService,
    private bookingOrchestrator: BookingOrchestrator
  ) {}

  getDepartures = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { resourceId, startDate, endDate } = req.query;
      const tenantId = (req as any).tenantId as string;
      
      if (!startDate || !endDate) {
        throw new AppError('startDate and endDate are required', 400);
      }

      const departures = await this.inventoryService.getDeparturesForCalendar(
        tenantId,
        new Date(startDate as string),
        new Date(endDate as string),
        resourceId ? { resourceId: resourceId as string } : undefined
      );

      res.json({ data: departures });
    } catch (error) {
      next(error);
    }
  };

  getDepartureById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const tenantId = (req as any).tenantId as string;
      
      const departure = await this.inventoryService.getDepartureWithInventory(id, tenantId);

      res.json({ data: departure });
    } catch (error) {
      next(error);
    }
  };

  createDeparture = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { 
        resourceId, departureDate, departureTime, endDate, cutoffDatetime,
        totalCapacity, blockedSeats, overbookingLimit, minParticipants, 
        priceOverride, currency, attributes 
      } = req.body;
      const tenantId = (req as any).tenantId as string;

      console.log('createDeparture called, tenantId:', tenantId);

      if (!resourceId || !departureDate || !totalCapacity) {
        throw new AppError('resourceId, departureDate, and totalCapacity are required', 400);
      }

      if (!tenantId) {
        throw new AppError('Tenant ID is required', 400);
      }

      const departure = await this.inventoryService.createDeparture({
        tenantId,
        resourceId,
        departureDate: new Date(departureDate),
        departureTime,
        endDate: endDate ? new Date(endDate) : undefined,
        cutoffDatetime: cutoffDatetime ? new Date(cutoffDatetime) : undefined,
        totalCapacity,
        blockedSeats,
        overbookingLimit,
        minParticipants,
        priceOverride,
        currency,
        attributes,
      });

      res.status(201).json({ data: departure });
    } catch (error) {
      next(error);
    }
  };

  getCalendar = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { resourceId, dateFrom, dateTo } = req.query;
      const tenantId = (req as any).tenantId as string;

      if (!dateFrom || !dateTo) {
        throw new AppError('dateFrom and dateTo are required', 400);
      }

      const departures = await this.inventoryService.getDeparturesForCalendar(
        tenantId,
        new Date(dateFrom as string),
        new Date(dateTo as string),
        resourceId ? { resourceId: resourceId as string } : undefined
      );

      // Extract unique resources from departures
      const resourceMap = new Map<string, { id: string; name: string; type: string }>();
      departures.forEach(d => {
        if (!resourceMap.has(d.departure.resourceId)) {
          resourceMap.set(d.departure.resourceId, {
            id: d.departure.resourceId,
            name: (d.departure as any).resourceName || 'Unknown',
            type: (d.departure as any).resourceType || 'TOUR',
          });
        }
      });

      // Format response to match CalendarData / CalendarDeparture interface
      const calendarData = {
        resources: Array.from(resourceMap.values()),
        departures: departures.map(d => {
          const filled = d.inventory.totalCapacity > 0 
            ? Math.round((d.inventory.confirmedSeats / d.inventory.totalCapacity) * 100) 
            : 0;
          return {
            id: d.departure.id,
            resourceId: d.departure.resourceId,
            resourceName: (d.departure as any).resourceName || 'Unknown',
            date: d.departure.departureDate.toISOString().split('T')[0],
            status: d.departure.status,
            totalCapacity: d.inventory.totalCapacity,
            confirmedSeats: d.inventory.confirmedSeats,
            heldSeats: d.inventory.heldSeats,
            availableSeats: d.inventory.availableSeats,
            percentFilled: filled,
          };
        }),
        dateRange: {
          start: dateFrom as string,
          end: dateTo as string,
        },
      };

      res.json({ data: calendarData });
    } catch (error) {
      next(error);
    }
  };

  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { dateFrom, dateTo } = req.query;
      const tenantId = (req as any).tenantId as string;

      // Get departures for date range to compute stats
      const start = dateFrom ? new Date(dateFrom as string) : new Date();
      const end = dateTo ? new Date(dateTo as string) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      const departures = await this.inventoryService.getDeparturesForCalendar(tenantId, start, end);

      const stats = {
        totalDepartures: departures.length,
        totalCapacity: departures.reduce((sum, d) => sum + d.inventory.totalCapacity, 0),
        confirmedSeats: departures.reduce((sum, d) => sum + d.inventory.confirmedSeats, 0),
        heldSeats: departures.reduce((sum, d) => sum + d.inventory.heldSeats, 0),
        availableSeats: departures.reduce((sum, d) => sum + d.inventory.availableSeats, 0),
        utilizationRate: departures.length > 0 
          ? Math.round(departures.reduce((sum, d) => sum + d.inventory.confirmedSeats, 0) / 
              departures.reduce((sum, d) => sum + d.inventory.totalCapacity, 0) * 100) 
          : 0,
      };

      res.json({ data: stats });
    } catch (error) {
      next(error);
    }
  };

  createHold = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { departureId, seatCount, holdType, source, sourcePlatform, sessionId } = req.body;
      const tenantId = (req as any).tenantId as string;
      const userId = (req as any).userId as string | undefined;

      if (!departureId || !seatCount) {
        throw new AppError('departureId and seatCount are required', 400);
      }

      const hold = await this.holdService.createHold({
        departureId,
        tenantId,
        seatCount,
        holdType: holdType || 'BOOKING',
        source: source || 'WEBSITE',
        sourcePlatform,
        createdById: userId,
        sessionId,
      });

      res.status(201).json({ data: hold });
    } catch (error) {
      next(error);
    }
  };

  extendHold = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { holdId } = req.params;
      const { holdType } = req.body;

      if (!holdType) {
        throw new AppError('holdType is required', 400);
      }

      const success = await this.holdService.extendHold(holdId, holdType as HoldType);
      
      if (!success) {
        throw new AppError('Failed to extend hold - hold may have expired', 400);
      }

      res.json({ message: 'Hold extended successfully' });
    } catch (error) {
      next(error);
    }
  };

  releaseHold = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { holdId } = req.params;
      const { reason } = req.body;
      const userId = (req as any).userId as string | undefined;
      
      await this.holdService.releaseHold(holdId, reason || 'user_cancelled', userId);
      res.json({ message: 'Hold released successfully' });
    } catch (error) {
      next(error);
    }
  };

  getActiveHolds = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { departureId } = req.params;
      
      const holds = await this.holdService.getActiveHolds(departureId);
      res.json({ data: holds });
    } catch (error) {
      next(error);
    }
  };

  createHoldForDeparture = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { departureId } = req.params;
      const { seatCount, holdType, source, sourcePlatform, sessionId } = req.body;
      const tenantId = (req as any).tenantId as string;
      const userId = (req as any).userId as string | undefined;

      if (!seatCount) {
        throw new AppError('seatCount is required', 400);
      }

      const hold = await this.holdService.createHold({
        departureId,
        tenantId,
        seatCount,
        holdType: holdType || 'BOOKING',
        source: source || 'WEBSITE',
        sourcePlatform,
        createdById: userId,
        sessionId,
      });

      res.status(201).json({ data: hold });
    } catch (error) {
      next(error);
    }
  };

  initiateBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { 
        departureId, 
        resourceId,
        participantCount,
        primaryGuest,
        additionalGuests,
        source, 
        sourcePlatform, 
        externalRef,
        sessionId, 
        specialRequirements,
        notes 
      } = req.body;
      const tenantId = (req as any).tenantId as string;
      const userId = (req as any).userId as string | undefined;

      if (!departureId || !resourceId || !participantCount || !primaryGuest) {
        throw new AppError('departureId, resourceId, participantCount, and primaryGuest are required', 400);
      }

      const result = await this.bookingOrchestrator.initiateBooking({
        tenantId,
        departureId,
        resourceId,
        participantCount,
        primaryGuest,
        additionalGuests,
        source: source || 'WEBSITE',
        sourcePlatform,
        externalRef,
        createdById: userId,
        sessionId,
        specialRequirements,
        notes,
      });

      res.status(201).json({ data: result });
    } catch (error) {
      next(error);
    }
  };

  confirmBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { holdId } = req.params;
      const { bookingId } = req.body;
      const tenantId = (req as any).tenantId as string;
      const userId = (req as any).userId as string | undefined;

      if (!bookingId) {
        throw new AppError('bookingId is required in request body', 400);
      }

      const result = await this.bookingOrchestrator.confirmBooking(
        bookingId,
        holdId,
        tenantId,
        userId
      );

      if (!result.success) {
        throw new AppError(result.errorMessage || 'Failed to confirm booking', 400);
      }

      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  };

  cancelBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bookingId } = req.params;
      const { reason } = req.body;
      const tenantId = (req as any).tenantId as string;
      const userId = (req as any).userId as string | undefined;

      const result = await this.bookingOrchestrator.cancelBooking(
        bookingId, 
        tenantId, 
        reason || 'User cancelled',
        userId
      );

      if (!result.success) {
        throw new AppError(result.errorMessage || 'Failed to cancel booking', 400);
      }

      res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
      next(error);
    }
  };
}
