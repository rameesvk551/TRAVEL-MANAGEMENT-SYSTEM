# WhatsApp Operations Layer

## Architecture Overview

The WhatsApp layer is designed as an **operations control surface** that integrates with the existing Travel Management System (TMS) without modifying core modules. It follows clean architecture principles and acts as an orchestration layer.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         WhatsApp Layer                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  Presentation      │  Application         │  Infrastructure            │
│  ─────────────────│──────────────────────│────────────────────────────│
│  • WebhookController │ • ConversationService │ • MetaCloudProvider     │
│  • ConversationController │ • MessageService    │ • MockProvider        │
│  • TimelineController    │ • TimelineService   │ • ConversationRepo    │
│  • TemplateController    │ • WorkflowOrchestrator │ • MessageRepo      │
│                    │ • OperationsCommandHandler │ • TimelineRepo       │
│                    │ • NotificationService │                           │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              │ CALLS EXISTING SERVICES (NO MODIFICATIONS)
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Existing TMS Core (UNTOUCHED)                         │
├─────────────────────────────────────────────────────────────────────────┤
│  • LeadService       • BookingService     • InventoryService            │
│  • PaymentRepository • EmployeeRepository • TripAssignmentRepository   │
│  • Domain Entities   • Business Rules     • State Machines             │
└─────────────────────────────────────────────────────────────────────────┘
```

## Key Principles

1. **No Core Modifications**: WhatsApp layer ONLY reads from and calls existing services
2. **Provider Agnostic**: Works with Meta, Twilio, Vonage, or any WhatsApp provider
3. **Multi-Tenant**: Inherits existing tenant isolation
4. **Role-Based**: Uses existing role hierarchy (staff, manager, admin, owner)
5. **Event-Driven**: Listens to core events for automatic notifications

## Domain Entities

### ConversationContext
Maps WhatsApp phone numbers to business entities (leads, bookings, departures, etc.)

```typescript
// A single phone number can be linked to multiple entities
const conversation = ConversationContext.create({
  tenantId: 'tenant-123',
  phoneNumber: '+1234567890',
  actorType: 'CUSTOMER', // or SALES, OPS, FIELD_CREW, MANAGER
});

// Link to business entities
conversation.linkEntity('LEAD', lead.id);
conversation.linkEntity('BOOKING', booking.id);
```

### UnifiedTimeline
Single source of truth for all interactions per booking/trip

```typescript
// Timeline aggregates ALL communication channels
const timeline = await timelineService.getTimeline('booking', bookingId);
// Returns: messages, status changes, payments, media uploads, issues, resolutions
```

### MessageTemplate
Pre-approved WhatsApp message templates with variable substitution

```typescript
const template = MessageTemplate.create({
  name: 'booking_confirmation',
  category: 'UTILITY',
  components: [
    { type: 'HEADER', text: 'Booking Confirmed! 🎉' },
    { type: 'BODY', text: 'Hi {{customer_name}}, your booking #{{booking_number}} is confirmed.' },
  ],
  triggerEvents: ['booking.confirmed'],
});
```

## Real-World Flows

### Flow 1: Enquiry → Lead → Quote → Booking → Payment → Trip → Payroll

```
Timeline:
─────────────────────────────────────────────────────────────────────────

Day 1: Lead Captured
─────────────────────────────────────────────────────────────────────────
[10:00] Customer WhatsApp: "Hi, interested in Ladakh trip"
        │
        ▼
[10:00] System: Create conversation context
        │
        ▼
[10:00] WorkflowOrchestrator calls LeadService.create()
        │
        ▼
[10:00] Timeline entry: LEAD_CREATED
        │
        ▼
[10:01] Auto-reply template: "Welcome! Let me help you..."
        │
        ▼
[10:05] Sales agent takes over conversation
        │
        ▼
[10:05] Sales command: "lead update QUALIFIED"
        │
        ▼
[10:05] OperationsCommandHandler calls LeadService.updateStage()

Day 2: Quote Sent
─────────────────────────────────────────────────────────────────────────
[11:00] Sales command: "send quote"
        │
        ▼
[11:00] WorkflowOrchestrator calls QuoteService.generate()
        │
        ▼
[11:00] Template: quote_sent with PDF attachment
        │
        ▼
[11:00] Timeline entry: QUOTE_SENT

Day 3: Booking Created
─────────────────────────────────────────────────────────────────────────
[14:00] Customer: "Yes, I want to book"
        │
        ▼
[14:00] Sales command: "convert BOOKING"
        │
        ▼
[14:00] WorkflowOrchestrator calls BookingOrchestrator.create()
        │
        ▼
[14:00] ConversationContext.linkEntity('BOOKING', bookingId)
        │
        ▼
[14:00] Timeline entries: BOOKING_CREATED, PAYMENT_PENDING
        │
        ▼
[14:01] Template: booking_created with payment link

Day 4: Payment Received
─────────────────────────────────────────────────────────────────────────
[09:00] Payment webhook triggers booking.payment_received event
        │
        ▼
[09:00] NotificationService.sendTriggerNotification()
        │
        ▼
[09:00] Template: payment_confirmation
        │
        ▼
[09:00] Timeline entry: PAYMENT_RECEIVED

Day 5 (Trip Day -1): Pre-Trip
─────────────────────────────────────────────────────────────────────────
[18:00] Scheduled job: departure.tomorrow event
        │
        ▼
[18:00] Template: trip_reminder with itinerary
        │
        ▼
[18:00] Staff assignment: Guide receives assignment.confirmed
        │
        ▼
[18:00] Guide template: assignment_details with roster

Day 6: Trip Day
─────────────────────────────────────────────────────────────────────────
[06:00] Guide WhatsApp: "start trip"
        │
        ▼
[06:00] OperationsCommandHandler.handleFieldCommand()
        │
        ▼
[06:00] TripAssignment.status = IN_PROGRESS
        │
        ▼
[06:00] Attendance.checkIn() called
        │
        ▼
[06:00] Timeline entry: TRIP_STARTED
        │
        ▼
[06:01] Customer notification: "Your guide is ready!"

[15:00] Guide: "upload photo" + image
        │
        ▼
[15:00] Media stored in timeline
        │
        ▼
[15:00] Timeline entry: MEDIA_UPLOADED

[20:00] Guide: "end trip"
        │
        ▼
[20:00] TripAssignment.status = COMPLETED
        │
        ▼
[20:00] Attendance.checkOut() called
        │
        ▼
[20:00] Timeline entry: TRIP_COMPLETED
        │
        ▼
[20:01] Customer template: feedback_request

Day 7+: Post-Trip
─────────────────────────────────────────────────────────────────────────
[10:00] Finance runs payroll
        │
        ▼
[10:00] PayrollService reads completed TripAssignments
        │
        ▼
[10:00] Expense report includes trip data
        │
        ▼
[10:01] Guide receives: salary_processed template
```

### Flow 2: Waitlist → Auto-Confirm

```
─────────────────────────────────────────────────────────────────────────
Initial State: Departure FULL, 2 people on waitlist
─────────────────────────────────────────────────────────────────────────

[Day 1, 14:00] Existing customer cancels
               │
               ▼
[14:00] BookingService.cancel() triggers booking.cancelled event
               │
               ▼
[14:00] InventoryService updates departure spots
               │
               ▼
[14:00] Departure status changes: FULL → FEW_LEFT
               │
               ▼
[14:01] WaitlistService.processWaitlist() 
               │
               ▼
[14:01] First waitlist person auto-confirmed
               │
               ▼
[14:01] NotificationService sends:
        • booking_confirmed to new customer
        • waitlist_position_updated to #2 customer
               │
               ▼
[14:01] Timeline entries for both bookings

[Day 1, 14:05] New customer responds: "Thank you!"
               │
               ▼
[14:05] Timeline entry: CUSTOMER_MESSAGE
               │
               ▼
[14:05] ConversationContext updated: lastMessageAt
```

### Flow 3: Guide Reports Issue → Resolution → Notifications

```
─────────────────────────────────────────────────────────────────────────
Trip in progress, Guide encounters vehicle breakdown
─────────────────────────────────────────────────────────────────────────

[10:00] Guide WhatsApp: "issue Vehicle breakdown at KM 45"
               │
               ▼
[10:00] OperationsCommandHandler.handleFieldCommand()
               │
               ▼
[10:00] Issue created in system
               │
               ▼
[10:00] Timeline entry: ISSUE_REPORTED (visibility: INTERNAL)
               │
               ▼
[10:01] Ops manager notified via WhatsApp
               │
               ▼
[10:01] ConversationContext escalated

[10:05] Ops manager responds: "Backup vehicle dispatched, ETA 30 min"
               │
               ▼
[10:05] Timeline entry: OPS_RESPONSE
               │
               ▼
[10:05] Guide receives update

[10:35] Guide: "resolve Vehicle arrived, continuing"
               │
               ▼
[10:35] Issue status: RESOLVED
               │
               ▼
[10:35] Timeline entry: ISSUE_RESOLVED
               │
               ▼
[10:36] Manager receives resolution notification
               │
               ▼
[10:36] Customer receives: "Small delay resolved, continuing!"

─────────────────────────────────────────────────────────────────────────
Post-Trip: Issue included in trip report for future reference
─────────────────────────────────────────────────────────────────────────
```

## API Reference

### Webhook Endpoints (No Auth)

```
GET  /api/whatsapp/webhook              # Verification challenge
POST /api/whatsapp/webhook              # Inbound messages
POST /api/whatsapp/webhook/meta         # Meta-specific webhook
POST /api/whatsapp/webhook/twilio       # Twilio-specific webhook
```

### Authenticated Endpoints

#### Conversations
```
GET  /api/whatsapp/conversations        # List conversations
GET  /api/whatsapp/conversations/:id    # Get conversation
POST /api/whatsapp/conversations/:id/link    # Link entity
POST /api/whatsapp/conversations/:id/assign  # Assign operator
POST /api/whatsapp/conversations/:id/escalate # Escalate
POST /api/whatsapp/conversations/:id/close   # Close
```

#### Messages
```
POST /api/whatsapp/messages/send        # Send text message
POST /api/whatsapp/messages/template    # Send template message
GET  /api/whatsapp/messages/:id/status  # Get message status
```

#### Timeline
```
GET  /api/whatsapp/timeline/lead/:id      # Lead timeline
GET  /api/whatsapp/timeline/booking/:id   # Booking timeline
GET  /api/whatsapp/timeline/departure/:id # Departure timeline
GET  /api/whatsapp/timeline/trip/:id      # Trip assignment timeline
POST /api/whatsapp/timeline/note          # Add manual note
GET  /api/whatsapp/timeline/search        # Search entries
```

#### Templates
```
GET  /api/whatsapp/templates            # List templates
GET  /api/whatsapp/templates/:id        # Get template
POST /api/whatsapp/templates            # Create template
PUT  /api/whatsapp/templates/:id        # Update template
POST /api/whatsapp/templates/:id/submit # Submit for approval
POST /api/whatsapp/templates/:id/test   # Test send
```

## Commands (Staff via WhatsApp)

### Sales Commands
```
create lead <phone> <name> [source]     # Create new lead
update lead <stage>                      # Update lead stage
send quote                               # Generate and send quote
convert BOOKING                          # Convert lead to booking
assign <staffId>                         # Assign to sales rep
```

### Operations Commands
```
hold <departureId> <slots> <duration>   # Hold inventory
release <holdId>                         # Release hold
close <departureId>                      # Close departure
open waitlist <departureId>              # Open waitlist
```

### Field Crew Commands
```
start trip                               # Start trip, check in
end trip                                 # End trip, check out
upload <caption>                         # Upload media with caption
issue <description>                      # Report issue
resolve <resolution>                     # Resolve issue
sos <message>                            # Emergency escalation
```

### Manager Commands
```
override <action> <entityId>             # Override actions
approve <type> <id>                      # Approve requests
escalate                                 # Escalate to higher level
```

## Integration Guide

### Step 1: Add Configuration

```typescript
// config/environment.ts
export const config = {
  // ... existing config
  whatsapp: {
    provider: 'meta', // or 'twilio', 'vonage', 'mock'
    meta: {
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    },
    appSecret: process.env.WHATSAPP_APP_SECRET,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
  },
};
```

### Step 2: Run Database Migration

```sql
-- Run the migration
\i server/src/infrastructure/database/migrations/20241223_whatsapp_tables.sql
```

### Step 3: Initialize in App

```typescript
// app.ts
import { initializeWhatsApp } from './infrastructure/whatsapp/index.js';

// After existing middleware setup
const whatsAppContainer = await initializeWhatsApp(app, pool, {
  authMiddleware: authenticate,
  tenantMiddleware: tenantContext,
  services: {
    leadService,
    bookingService,
    inventoryService,
    paymentRepo,
    employeeRepo,
    tripAssignmentRepo,
  },
  eventEmitter: appEvents, // Optional: for automatic notifications
});
```

### Step 4: Configure Webhook in Meta Developer Console

1. Go to Meta Business Suite
2. Add Webhook URL: `https://your-domain.com/api/whatsapp/webhook`
3. Add Verify Token: (same as WHATSAPP_VERIFY_TOKEN)
4. Subscribe to: `messages`, `messaging_postbacks`

## Best Practices

1. **Always use templates for outbound**: Templates are pre-approved and have higher delivery rates
2. **Record timeline entries**: Every significant action should be recorded
3. **Check opt-in status**: Always verify opt-in before sending marketing messages
4. **Use conversation context**: Link phone numbers to business entities for context
5. **Handle errors gracefully**: Log failed messages and retry appropriately
6. **Monitor rate limits**: Track usage to avoid hitting provider limits

## Testing

### Using Mock Provider

```typescript
// In test environment
const container = createWhatsAppContainer(pool, {});
// MockProvider is used by default when no config is present

// Simulate inbound message
await container.webhookController.handleInboundMessage({
  from: '+1234567890',
  text: 'Hello!',
  timestamp: Date.now(),
});
```

### E2E Testing

```typescript
// Test the full flow
const response = await request(app)
  .post('/api/whatsapp/webhook')
  .send({
    object: 'whatsapp_business_account',
    entry: [{
      changes: [{
        value: {
          messages: [{
            from: '1234567890',
            type: 'text',
            text: { body: 'Hello!' },
            timestamp: Date.now().toString(),
          }],
        },
      }],
    }],
  });

expect(response.status).toBe(200);
```

## Competitive Advantages

Unlike Travelopro (basic booking chat) and Rezdy (inventory sync only), this WhatsApp layer provides:

1. **Operations Control**: Staff can manage leads, inventory, and trips via WhatsApp
2. **Unified Timeline**: Single view of all customer interactions across channels
3. **Multi-Actor Support**: Different interfaces for customers, sales, ops, and field crew
4. **Automatic Triggers**: Event-driven notifications without manual intervention
5. **Field Operations**: Guides can check in/out, upload photos, report issues
6. **Compliance Built-in**: GDPR/TCPA opt-in management
7. **Provider Flexibility**: Switch providers without code changes
