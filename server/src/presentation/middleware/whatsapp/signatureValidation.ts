// presentation/middleware/whatsapp/signatureValidation.ts
// Validates webhook signatures from WhatsApp providers

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { getConfig } from '../../../config/index.js';

/**
 * Validate Meta Cloud API webhook signature
 * @see https://developers.facebook.com/docs/messenger-platform/webhooks#validate-payload
 */
export function validateMetaSignature(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const config = getConfig();
  const appSecret = config.whatsapp?.appSecret;

  if (!appSecret) {
    console.warn('WhatsApp app secret not configured - skipping signature validation');
    next();
    return;
  }

  const signature = req.headers['x-hub-signature-256'] as string;

  if (!signature) {
    console.warn('Missing X-Hub-Signature-256 header');
    res.status(401).json({ error: 'Missing signature' });
    return;
  }

  const rawBody = (req as any).rawBody;

  if (!rawBody) {
    console.error('Raw body not available for signature validation');
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  if (!isValid) {
    console.warn('Invalid webhook signature');
    res.status(401).json({ error: 'Invalid signature' });
    return;
  }

  next();
}

/**
 * Middleware to capture raw body for signature validation
 * Must be used before body parsing
 */
export function captureRawBody(
  req: Request,
  res: Response,
  buf: Buffer,
  encoding: BufferEncoding
): void {
  (req as any).rawBody = buf.toString(encoding || 'utf8');
}

/**
 * Combined middleware that validates based on provider type
 */
export function validateWebhookSignature(providerType: 'meta' | 'twilio' | 'vonage') {
  return (req: Request, res: Response, next: NextFunction): void => {
    switch (providerType) {
      case 'meta':
        validateMetaSignature(req, res, next);
        break;
      case 'twilio':
        // TODO: Implement Twilio signature validation
        next();
        break;
      case 'vonage':
        // TODO: Implement Vonage signature validation
        next();
        break;
      default:
        next();
    }
  };
}

/**
 * Verify challenge for webhook registration (Meta)
 */
export function verifyWebhookChallenge(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const config = getConfig();
  const verifyToken = config.whatsapp?.verifyToken;

  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Webhook verified successfully');
      res.status(200).send(challenge);
      return;
    }

    console.warn('Webhook verification failed');
    res.status(403).send('Verification failed');
    return;
  }

  next();
}
