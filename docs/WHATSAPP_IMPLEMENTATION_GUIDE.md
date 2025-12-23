# WhatsApp Operations Layer - Implementation Guide

This document provides step-by-step instructions for implementing and deploying the WhatsApp Operations Layer.

## Prerequisites

1. **WhatsApp Business API Access**
   - WhatsApp Business Account
   - Verified Business Phone Number
   - Provider Account (Meta, Twilio, or 360Dialog)
   - Webhook URL (HTTPS required)

2. **Database**
   - PostgreSQL 12+
   - Run migration: `010_whatsapp_operations_layer.sql`

3. **Server Requirements**
   - Node.js 18+
   - TypeScript 5+
   - Express.js

## Step 1: Database Migration

Run the WhatsApp operations layer migration:

```bash
cd server
npm run migrate
```

This creates:
- `whatsapp_conversations`
- `whatsapp_messages`
- `whatsapp_templates`
- `timeline_entries`
- `whatsapp_audit_logs`
- `whatsapp_media`
- `whatsapp_opt_ins`
- `whatsapp_broadcast_lists`
- `whatsapp_configurations`

## Step 2: Environment Configuration

Add to your `.env` file:

```env
# WhatsApp Configuration
WHATSAPP_PROVIDER=meta  # or twilio, 360dialog
WHATSAPP_PHONE_NUMBER=+1234567890
WHATSAPP_WEBHOOK_SECRET=your-webhook-secret
WHATSAPP_VERIFY_TOKEN=your-verify-token

# Meta/Facebook (if using Meta)
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id

# Twilio (if using Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token

# Features
WHATSAPP_ENABLE_MEDIA=true
WHATSAPP_ENABLE_TEMPLATES=true
WHATSAPP_MESSAGE_RETENTION_DAYS=90
```

## Step 3: Repository Implementation

The repository implementations connect domain layer to PostgreSQL. They follow the existing pattern used in the TMS.

### Example: WhatsAppConversationRepository

Located in: `server/src/infrastructure/repositories/whatsapp/WhatsAppConversationRepository.ts`

Key methods:
- `save()` - Insert or update conversation
- `findActiveByPhoneNumber()` - Get active conversation
- `updateState()` - Update conversation state
- `expireOldConversations()` - Cleanup job

## Step 4: WhatsApp Provider Implementation

### Provider Interface

All providers implement `IWhatsAppProvider`:
- `sendMessage()` - Send text/media messages
- `sendTemplate()` - Send pre-approved templates
- `uploadMedia()` - Upload media files
- `getMediaUrl()` - Retrieve media URLs

### Meta Provider Example

```typescript
// infrastructure/whatsapp/MetaWhatsAppProvider.ts

export class MetaWhatsAppProvider implements IWhatsAppProvider {
  async sendMessage(to: string, content: MessageContent) {
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to.replace('+', ''),
      type: content.type,
      [content.type]: this.buildMessageContent(content),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    return {
      messageId: data.messages[0].id,
      success: true,
    };
  }
}
```

## Step 5: Webhook Setup

### Webhook Endpoint

Located in: `server/src/presentation/controllers/WhatsAppWebhookController.ts`

```typescript
export class WhatsAppWebhookController {
  // GET - Webhook verification
  async verify(req: Request, res: Response) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      res.send(challenge);
    } else {
      res.sendStatus(403);
    }
  }

  // POST - Incoming messages
  async handleIncoming(req: Request, res: Response) {
    const body = req.body;

    // Validate webhook signature
    // Process messages
    // Return 200 quickly
    
    res.sendStatus(200);
    
    // Process in background
    this.processWebhookAsync(body);
  }
}
```

### Webhook Route

```typescript
// presentation/routes/whatsapp.routes.ts

router.get('/webhook', webhookController.verify);
router.post('/webhook', webhookController.handleIncoming);
```

## Step 6: Message Processing Flow

### 1. Webhook receives message
```
POST /api/whatsapp/webhook
```

### 2. Validate and parse
```typescript
const message = parseIncomingMessage(payload);
```

### 3. Route to MessageRouter
```typescript
await messageRouter.routeMessage(message, context);
```

### 4. MessageRouter determines intent
- Customer enquiry → Create lead
- Booking status → Query booking
- Field staff issue → Log incident

### 5. BusinessObjectOrchestrator executes
```typescript
await orchestrator.createLeadFromWhatsApp(input, conversationId);
```

### 6. Core service processes
```typescript
await leadService.createLead(data, context);
```

### 7. Timeline updated
```typescript
await timelineService.addEntry(entry, tenantId);
```

### 8. Response sent
```typescript
await provider.sendMessage(phoneNumber, response);
```

## Step 7: Role-Based Access Control

### Permission Matrix

| Role | Capabilities |
|------|-------------|
| Customer | Enquire, check status, pay |
| Sales | Create leads, send quotes, convert bookings |
| Operations | Manage inventory, assign staff, broadcast |
| Field Staff | Check-in, report issues, upload media |
| Manager | All operations + approvals |

### Implementation

```typescript
// Middleware
export function checkWhatsAppPermission(requiredRole: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await getUserByPhone(req.body.from);
    
    if (!user || !hasRole(user, requiredRole)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    req.whatsappContext = {
      userId: user.id,
      userRole: user.role,
      phoneNumber: req.body.from,
    };
    
    next();
  };
}
```

## Step 8: Template Management

### Creating Templates

Templates must be approved by WhatsApp before use.

```typescript
// Example: Payment reminder template
{
  name: 'payment_reminder',
  category: 'TRANSACTIONAL',
  language: 'en',
  header: 'Payment Reminder',
  body: 'Hi {{1}}, your booking {{2}} has a pending payment of {{3}}. Pay now: {{4}}',
  footer: 'Travel Management System',
  buttons: [
    { type: 'url', text: 'Pay Now', url: '{{5}}' }
  ]
}
```

### Sending Templates

```typescript
await provider.sendTemplate(phoneNumber, {
  name: 'payment_reminder',
  language: 'en',
  components: [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: customerName },
        { type: 'text', text: bookingId },
        { type: 'text', text: amount },
        { type: 'text', text: paymentUrl },
      ]
    }
  ]
});
```

## Step 9: Real-World Workflow Examples

### Workflow 1: Customer Enquiry → Booking

```
1. Customer sends: "Hi, interested in EBC Trek for 2 people in December"

2. System:
   - Creates conversation
   - Creates lead via LeadService
   - Binds conversation to lead
   - Assigns to sales rep
   - Sends confirmation message

3. Sales rep (via Web):
   - Views lead in dashboard
   - Prepares quote
   - Sends quote via WhatsApp

4. Customer: "Looks good, how do I book?"

5. System:
   - Sales rep converts lead → booking
   - System sends payment link via WhatsApp
   - Customer pays
   - Booking confirmed
   - Customer receives confirmation
```

### Workflow 2: Field Staff Issue Reporting

```
1. Guide sends: "ISSUE TRP123 Vehicle breakdown at checkpoint"

2. System:
   - Validates guide assignment to trip
   - Creates incident on timeline
   - Notifies operations manager
   - Sends confirmation to guide

3. Ops Manager (via Web):
   - Views incident
   - Arranges backup vehicle
   - Updates incident

4. System:
   - Notifies guide via WhatsApp
   - Notifies customers via WhatsApp
   - Updates timeline

5. Guide: "RESOLVED TRP123"

6. System:
   - Marks incident resolved
   - Logs on timeline
```

## Step 10: Monitoring & Analytics

### Metrics to Track

1. **Message Metrics**
   - Messages sent/received
   - Delivery rate
   - Read rate
   - Response time

2. **Conversation Metrics**
   - Active conversations
   - Average duration
   - Completion rate

3. **Business Metrics**
   - Enquiries → Leads conversion
   - Leads → Bookings conversion
   - Average response time by role

### Dashboard Queries

```sql
-- Messages sent today
SELECT COUNT(*) 
FROM whatsapp_messages 
WHERE direction = 'OUTBOUND' 
AND DATE(sent_at) = CURRENT_DATE;

-- Enquiries converted to leads
SELECT COUNT(*) 
FROM timeline_entries 
WHERE event_type = 'SYSTEM' 
AND content->>'action' = 'LEAD_CREATED'
AND source = 'WHATSAPP';
```

## Step 11: Testing

### Unit Tests

Test individual components:
- ConversationContextService
- MessageRouter
- BusinessObjectOrchestrator
- TimelineService

### Integration Tests

Test workflows:
- Customer enquiry flow
- Booking status check
- Field staff check-in

### End-to-End Tests

Test with actual WhatsApp API (sandbox):
1. Send test message
2. Verify webhook receipt
3. Check database updates
4. Verify response message

## Step 12: Deployment

### Production Checklist

- [ ] Database migration completed
- [ ] Environment variables configured
- [ ] Webhook endpoint accessible (HTTPS)
- [ ] Webhook verified with WhatsApp
- [ ] Templates submitted for approval
- [ ] Rate limits configured
- [ ] Monitoring enabled
- [ ] Backup strategy in place

### Webhook URL Setup

1. Deploy server with HTTPS
2. Configure webhook in WhatsApp Business Account
3. Set webhook URL: `https://your-domain.com/api/whatsapp/webhook`
4. Set verify token
5. Subscribe to webhook events

### Scaling Considerations

1. **Message Queue**: Use Redis/Bull for async processing
2. **Caching**: Cache active conversations in Redis
3. **Rate Limiting**: Per tenant limits
4. **Load Balancing**: Multiple webhook handlers

## Security Best Practices

1. **Validate Webhook Signatures**: Always verify incoming webhooks
2. **Encrypt Phone Numbers**: Hash/encrypt in database
3. **Rate Limiting**: Prevent abuse
4. **Audit Logging**: Log all actions
5. **Data Retention**: Auto-delete old messages (90 days)

## Troubleshooting

### Issue: Messages not being received

**Check:**
- Webhook URL accessible
- Webhook subscribed to message events
- Verify token correct
- Check server logs

### Issue: Messages not sending

**Check:**
- Provider credentials valid
- Phone number format correct
- Template approved (if using templates)
- Rate limits not exceeded

### Issue: Conversation state issues

**Check:**
- Conversation not expired
- State transitions valid
- Database updates successful

## Next Steps

1. Implement repository layer (PostgreSQL)
2. Implement provider layer (Meta/Twilio)
3. Create webhook controller
4. Set up message templates
5. Configure monitoring
6. Deploy to production
7. Test with real users

## Support & Documentation

- Architecture: `docs/WHATSAPP_ARCHITECTURE.md`
- API Reference: `docs/API.md`
- Database Schema: `migrations/010_whatsapp_operations_layer.sql`

---

**Version**: 1.0  
**Last Updated**: December 2024
