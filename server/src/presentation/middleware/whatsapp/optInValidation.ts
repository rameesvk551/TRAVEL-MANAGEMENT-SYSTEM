// presentation/middleware/whatsapp/optInValidation.ts
// Validate opt-in status before sending messages

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to validate opt-in status before sending messages
 * Ensures GDPR/TCPA compliance
 */
export function validateOptIn(optInRepo: any) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.context?.tenantId;
      const { to, phone, recipient } = req.body;
      const phoneNumber = to || phone || recipient;

      if (!tenantId) {
        res.status(401).json({ error: 'Tenant required' });
        return;
      }

      if (!phoneNumber) {
        res.status(400).json({ error: 'Phone number required' });
        return;
      }

      // Check opt-in status
      const optIn = await optInRepo.findByPhone(phoneNumber, tenantId);

      if (!optIn) {
        res.status(403).json({
          error: 'No opt-in record',
          message: 'Recipient has not opted in to receive WhatsApp messages',
          code: 'NO_OPT_IN',
        });
        return;
      }

      if (optIn.status !== 'OPTED_IN') {
        res.status(403).json({
          error: 'Not opted in',
          message: `Recipient has status: ${optIn.status}`,
          code: 'OPT_IN_INACTIVE',
          status: optIn.status,
        });
        return;
      }

      // Check specific permissions based on message type
      const messageType = req.body.type || req.body.category || 'transactional';

      if (messageType === 'marketing' && !optIn.permissions?.marketing) {
        res.status(403).json({
          error: 'Marketing not permitted',
          message: 'Recipient has not consented to marketing messages',
          code: 'NO_MARKETING_CONSENT',
        });
        return;
      }

      // Attach opt-in to request for downstream use
      (req as any).optIn = optIn;

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Optional opt-in check - logs warning but doesn't block
 * Use for service messages where opt-in may not be strictly required
 */
export function softValidateOptIn(optInRepo: any) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.context?.tenantId;
      const { to, phone, recipient } = req.body;
      const phoneNumber = to || phone || recipient;

      if (tenantId && phoneNumber) {
        const optIn = await optInRepo.findByPhone(phoneNumber, tenantId);

        if (!optIn || optIn.status !== 'OPTED_IN') {
          console.warn(`Sending to non-opted-in recipient: ${phoneNumber} (tenant: ${tenantId})`);
          // Attach warning to request
          (req as any).optInWarning = 'Recipient opt-in status not verified';
        } else {
          (req as any).optIn = optIn;
        }
      }

      next();
    } catch (error) {
      // Log but don't fail
      console.error('Opt-in check failed:', error);
      next();
    }
  };
}

/**
 * Record opt-in from incoming message
 * When customer initiates contact, they implicitly opt in
 */
export function recordImplicitOptIn(optInRepo: any) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.context?.tenantId;
      const phoneNumber = req.body?.from || req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;

      if (tenantId && phoneNumber) {
        // Check if opt-in already exists
        const existing = await optInRepo.findByPhone(phoneNumber, tenantId);

        if (!existing) {
          // Create implicit opt-in from customer-initiated contact
          const { WhatsAppOptIn } = await import('../../../domain/entities/whatsapp/index.js');

          const optIn = WhatsAppOptIn.create({
            tenantId,
            phoneNumber,
            countryCode: phoneNumber.substring(0, 2), // Simplified
            source: 'CUSTOMER_INITIATED',
            channel: 'WHATSAPP',
            permissions: {
              transactional: true,
              marketing: false, // Must explicitly consent for marketing
              updates: true,
            },
            metadata: {
              implicitOptIn: true,
              firstContactAt: new Date().toISOString(),
            },
          });

          await optInRepo.save(optIn);
          console.log(`Implicit opt-in recorded for: ${phoneNumber}`);
        }
      }

      next();
    } catch (error) {
      // Log but don't fail - opt-in recording is secondary
      console.error('Failed to record implicit opt-in:', error);
      next();
    }
  };
}
