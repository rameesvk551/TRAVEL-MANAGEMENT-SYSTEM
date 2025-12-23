// presentation/middleware/whatsapp/index.ts
// Export all WhatsApp middleware

export {
  validateMetaSignature,
  captureRawBody,
  validateWebhookSignature,
  verifyWebhookChallenge,
} from './signatureValidation.js';

export {
  createRateLimiter,
  webhookRateLimiter,
  sendMessageRateLimiter,
  bulkOperationRateLimiter,
  apiRateLimiter,
  cleanupRateLimitStore,
} from './rateLimiting.js';

export {
  validateOptIn,
  softValidateOptIn,
  recordImplicitOptIn,
} from './optInValidation.js';
