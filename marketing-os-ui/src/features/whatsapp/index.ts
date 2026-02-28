// features/whatsapp/index.ts
// Barrel export for the WhatsApp feature module.
// Import everything from here — keeps the module self-contained.

// ── Page (entry point for routing) ──
export { default as WhatsAppDashboard } from './pages/WhatsAppDashboard';

// ── Components (for reuse outside the module if needed) ──
export { default as WhatsAppChats } from './components/WhatsAppChats';
export { default as WhatsAppTemplates } from './components/WhatsAppTemplates';
export { default as WhatsAppBroadcast } from './components/WhatsAppBroadcast';
export { default as WhatsAppAutomation } from './components/WhatsAppAutomation';
export { default as WhatsAppAnalytics } from './components/WhatsAppAnalytics';
export { default as WhatsAppContacts } from './components/WhatsAppContacts';

// ── API (legacy flat object — kept for backward compatibility) ──
export { whatsappApi } from './api/whatsappApi';

// ── Services (domain-split API layer) ──
export {
    conversationService,
    templateService,
    broadcastService,
    automationRuleService,
    automationFlowService,
    analyticsService,
    contactService,
} from './services';

// ── Hooks ──
export { useWhatsAppSocket } from './hooks/useWhatsAppSocket';
export { useChats } from './hooks/useChats';
export { useTemplates } from './hooks/useTemplates';
export { useBroadcast } from './hooks/useBroadcast';
export { useAutomation } from './hooks/useAutomation';
export { useAnalytics } from './hooks/useAnalytics';
export { useContacts } from './hooks/useContacts';
