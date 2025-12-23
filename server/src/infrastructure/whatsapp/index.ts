// infrastructure/whatsapp/index.ts
// Main export for WhatsApp infrastructure layer

// Integration
export {
  initializeWhatsApp,
  getWhatsAppHealth,
  type WhatsAppIntegrationOptions,
} from './integration.js';

// Container
export {
  createWhatsAppContainer,
  type WhatsAppContainer,
} from './container.js';

// Providers
export * from './providers/index.js';

// Repositories
export * from './repositories/index.js';
