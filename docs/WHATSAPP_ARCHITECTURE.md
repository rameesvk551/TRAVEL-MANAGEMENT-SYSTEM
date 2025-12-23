# WhatsApp Operations Layer - System Architecture

> **Integration Philosophy**: WhatsApp as a Control Surface for Travel Operations
>
> WhatsApp is NOT the system. WhatsApp is a remote control that operates the system.

---

## 🎯 Core Principles

### What WhatsApp IS
- **Operations Interface** - Remote control for business operations
- **Command Surface** - Executes commands against existing APIs
- **Notification Channel** - Delivers real-time updates
- **Context Manager** - Maintains conversation state

### What WhatsApp is NOT
- ❌ A database
- ❌ A rules engine
- ❌ A decision maker
- ❌ A duplicate workflow system

---

## 🏗️ System Architecture

### Layered Integration Design

```
┌─────────────────────────────────────────────────────────────┐
│                    WhatsApp Business API                     │
│                  (Twilio / Meta / 360Dialog)                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              WhatsApp Adapter Service (NEW)                  │
│  • Webhook handler                                           │
│  • Message normalization                                     │
│  • Provider abstraction                                      │
│  • Idempotency checks                                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│          Conversation Context Engine (NEW)                   │
│  • Session management                                        │
│  • State tracking                                            │
│  • Multi-turn conversations                                  │
│  • Context recovery                                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│        Business Object Orchestrator (NEW)                    │
│  • Maps conversation → Business object                       │
│  • Validates permissions                                     │
│  • Prepares API calls                                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              EXISTING CORE SERVICES                          │
│  • LeadService                                               │
│  • BookingService                                            │
│  • InventoryService                                          │
│  • HRMS Services                                             │
│  • PaymentService                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Component Breakdown

### 1. WhatsApp Adapter Service
**Location**: `server/src/infrastructure/whatsapp/`

**Responsibilities**:
- Receive webhooks from WhatsApp providers
- Normalize messages to internal format
- Send messages via provider API
- Handle media uploads/downloads
- Manage delivery/read receipts

**Provider Abstraction**:
```typescript
interface IWhatsAppProvider {
  sendMessage(to: string, content: MessageContent): Promise<string>;
  sendTemplate(to: string, template: Template): Promise<string>;
  uploadMedia(file: Buffer): Promise<string>;
  getMediaUrl(mediaId: string): Promise<string>;
}
```

### 2. Conversation Context Engine
**Location**: `server/src/application/services/whatsapp/`

**Responsibilities**:
- Track conversation state
- Maintain user context
- Handle multi-turn dialogues
- Recover from interruptions

**Context Schema**:
```typescript
interface ConversationContext {
  id: string;
  tenantId: string;
  phoneNumber: string;
  userId?: string;
  userRole?: string;
  
  // Business object binding
  boundObjectType?: 'LEAD' | 'BOOKING' | 'TRIP' | 'PAYMENT' | 'TASK';
  boundObjectId?: string;
  
  // State machine
  currentState: string;
  stateData: Record<string, unknown>;
  
  // Session
  startedAt: Date;
  lastMessageAt: Date;
  expiresAt: Date;
  isActive: boolean;
}
```

### 3. Message Router
**Location**: `server/src/application/services/whatsapp/MessageRouter.ts`

Routes messages to appropriate handlers based on:
- User role
- Conversation context
- Message intent
- Business object type

### 4. Unified Timeline Service
**Location**: `server/src/application/services/TimelineService.ts`

**Purpose**: Single source of truth for all activities related to a business object.

**Timeline Entry**:
```typescript
interface TimelineEntry {
  id: string;
  tenantId: string;
  objectType: 'LEAD' | 'BOOKING' | 'TRIP' | 'PAYMENT';
  objectId: string;
  
  eventType: 'MESSAGE' | 'STATUS_CHANGE' | 'PAYMENT' | 'MEDIA' | 'NOTE';
  source: 'WHATSAPP' | 'WEB' | 'API' | 'SYSTEM';
  
  actorId?: string;
  actorName?: string;
  actorRole?: string;
  
  content: {
    text?: string;
    mediaUrl?: string;
    metadata?: Record<string, unknown>;
  };
  
  timestamp: Date;
}
```

---

## 🔄 State Machines

### Lead State Machine (REUSED)
WhatsApp reads and requests transitions, DOES NOT define them.

```
NEW → CONTACTED → QUALIFIED → QUOTED → WON / LOST
```

**WhatsApp Actions**:
- ✅ Read current state
- ✅ Request transition (e.g., "Move to QUALIFIED")
- ✅ Add notes
- ❌ Skip validation rules
- ❌ Define new states

### Booking State Machine (REUSED)
```
DRAFT → HELD → PAYMENT_PENDING → CONFIRMED → ACTIVE → COMPLETED
```

**WhatsApp Actions**:
- ✅ View booking details
- ✅ Send payment link
- ✅ Confirm payment received
- ✅ Cancel booking
- ❌ Bypass payment validation

### Trip State Machine (REUSED)
```
SCHEDULED → STAFF_ASSIGNED → STARTED → IN_PROGRESS → ENDED → CLOSED
```

**WhatsApp Actions** (Field Staff):
- ✅ Start trip (SCHEDULED → STARTED)
- ✅ Upload media
- ✅ Report issues
- ✅ End trip (IN_PROGRESS → ENDED)
- ❌ Modify trip assignments

---

## 👥 Role-Based Operations

### Customer Role
**Capabilities**:
- Enquire about tours
- View booking status
- Make payments via link
- Receive trip updates
- Upload feedback/photos

**Restrictions**:
- Cannot access other customers' data
- Cannot modify inventory
- Cannot approve anything

### Sales Role
**Capabilities**:
- Create/update leads
- Send quotes
- Convert lead → booking
- Trigger payment links
- View pipeline

**Restrictions**:
- Cannot close departures
- Cannot assign staff
- Cannot approve expenses

### Operations Role
**Capabilities**:
- Hold/release inventory
- Assign staff to trips
- Close departures
- Broadcast updates
- View all bookings

**Restrictions**:
- Cannot approve payroll
- Cannot delete leads

### Field Staff (Guide/Driver) Role
**Capabilities**:
- Check-in to trip
- Upload trip photos/videos
- Report issues/incidents
- Request trip extensions
- Check-out from trip
- View assigned trips only

**Restrictions**:
- Cannot view other staff assignments
- Cannot modify bookings
- Cannot access financial data

### Manager Role
**Capabilities**:
- All sales + ops capabilities
- Approve holds beyond limits
- Override slot limits
- View all analytics
- Broadcast announcements

---

## 🔐 Permission System

### Message Template Governance
Templates are pre-approved and role-restricted:

```typescript
interface MessageTemplate {
  id: string;
  name: string;
  category: 'MARKETING' | 'TRANSACTIONAL' | 'OPERATIONAL';
  allowedRoles: UserRole[];
  requiresApproval: boolean;
  content: string;
  variables: string[];
}
```

### Audit Logging
Every WhatsApp action logged:

```typescript
interface WhatsAppAuditLog {
  id: string;
  tenantId: string;
  timestamp: Date;
  
  userId: string;
  userRole: string;
  phoneNumber: string;
  
  action: string;
  objectType?: string;
  objectId?: string;
  
  requestData: unknown;
  responseData: unknown;
  
  success: boolean;
  errorMessage?: string;
}
```

---

## 🎭 Real-World Workflows

### Workflow 1: WhatsApp Enquiry → Booking → Trip → Completion

```
1. CUSTOMER sends enquiry via WhatsApp
   ↓
2. SYSTEM creates Lead, assigns to sales rep
   ↓
3. SALES REP responds with quote via WhatsApp
   ↓
4. CUSTOMER confirms interest
   ↓
5. SALES REP converts to Booking, sends payment link
   ↓
6. CUSTOMER pays via link
   ↓
7. SYSTEM confirms booking, creates departure slot
   ↓
8. OPS assigns staff to trip
   ↓
9. GUIDE receives assignment notification
   ↓
10. GUIDE checks in to trip start
    ↓
11. GUIDE uploads trip photos
    ↓
12. GUIDE reports issue (if any)
    ↓
13. OPS resolves issue, notifies customer
    ↓
14. GUIDE checks out, trip completed
    ↓
15. CUSTOMER receives completion notification + feedback request
```

### Workflow 2: Slot Full → Waitlist → Auto-Confirm

```
1. CUSTOMER enquires about tour
   ↓
2. SYSTEM checks availability: FULL
   ↓
3. SYSTEM offers waitlist option
   ↓
4. CUSTOMER opts into waitlist
   ↓
5. [LATER] Another booking cancels
   ↓
6. SYSTEM detects available slot
   ↓
7. SYSTEM sends WhatsApp to waitlist customer
   ↓
8. CUSTOMER confirms within 2 hours
   ↓
9. SYSTEM auto-creates booking, sends payment link
```

### Workflow 3: Guide Issue → Ops Resolution → Customer Notification

```
1. GUIDE on trip reports issue via WhatsApp
   "Vehicle breakdown at checkpoint"
   ↓
2. SYSTEM creates incident ticket
   ↓
3. SYSTEM notifies OPS MANAGER
   ↓
4. OPS MANAGER arranges backup vehicle
   ↓
5. OPS MANAGER updates incident
   ↓
6. SYSTEM notifies GUIDE
   ↓
7. SYSTEM notifies CUSTOMERS with status
   ↓
8. GUIDE confirms resolution
   ↓
9. SYSTEM logs incident on trip timeline
```

---

## 🗄️ Database Schema

### whatsapp_conversations
```sql
CREATE TABLE whatsapp_conversations (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  phone_number VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES users(id),
  
  bound_object_type VARCHAR(50),
  bound_object_id UUID,
  
  current_state VARCHAR(100) NOT NULL,
  state_data JSONB DEFAULT '{}',
  
  started_at TIMESTAMPTZ NOT NULL,
  last_message_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  metadata JSONB DEFAULT '{}',
  
  INDEX idx_phone (tenant_id, phone_number),
  INDEX idx_user (tenant_id, user_id),
  INDEX idx_object (tenant_id, bound_object_type, bound_object_id)
);
```

### whatsapp_messages
```sql
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id),
  
  direction VARCHAR(20) NOT NULL, -- 'INBOUND' | 'OUTBOUND'
  message_type VARCHAR(50) NOT NULL, -- 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'TEMPLATE'
  
  sender_phone VARCHAR(50),
  recipient_phone VARCHAR(50),
  
  content TEXT,
  media_url VARCHAR(500),
  media_type VARCHAR(50),
  
  external_message_id VARCHAR(255),
  status VARCHAR(50), -- 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
  
  sent_at TIMESTAMPTZ NOT NULL,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  metadata JSONB DEFAULT '{}',
  
  INDEX idx_conversation (conversation_id, sent_at DESC),
  INDEX idx_external (external_message_id)
);
```

### whatsapp_templates
```sql
CREATE TABLE whatsapp_templates (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  language VARCHAR(10) DEFAULT 'en',
  
  header TEXT,
  body TEXT NOT NULL,
  footer TEXT,
  
  variables JSONB DEFAULT '[]',
  allowed_roles JSONB DEFAULT '[]',
  requires_approval BOOLEAN DEFAULT false,
  
  status VARCHAR(50) DEFAULT 'ACTIVE',
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, name)
);
```

### timeline_entries
```sql
CREATE TABLE timeline_entries (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  object_type VARCHAR(50) NOT NULL,
  object_id UUID NOT NULL,
  
  event_type VARCHAR(50) NOT NULL,
  source VARCHAR(50) NOT NULL,
  
  actor_id UUID REFERENCES users(id),
  actor_name VARCHAR(255),
  actor_role VARCHAR(50),
  
  content JSONB NOT NULL,
  
  timestamp TIMESTAMPTZ NOT NULL,
  
  INDEX idx_object (tenant_id, object_type, object_id, timestamp DESC),
  INDEX idx_actor (tenant_id, actor_id, timestamp DESC)
);
```

### whatsapp_audit_logs
```sql
CREATE TABLE whatsapp_audit_logs (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  timestamp TIMESTAMPTZ NOT NULL,
  
  user_id UUID REFERENCES users(id),
  user_role VARCHAR(50),
  phone_number VARCHAR(50),
  
  action VARCHAR(255) NOT NULL,
  object_type VARCHAR(50),
  object_id UUID,
  
  request_data JSONB,
  response_data JSONB,
  
  success BOOLEAN NOT NULL,
  error_message TEXT,
  
  INDEX idx_user (tenant_id, user_id, timestamp DESC),
  INDEX idx_action (tenant_id, action, timestamp DESC)
);
```

---

## 🚀 MVP vs Enterprise Rollout

### Phase 1: WhatsApp as Ops Interface (MVP)
**Timeline**: 4-6 weeks

**Features**:
- Customer enquiry → Lead creation
- Sales quote sending
- Payment link sharing
- Booking status lookup
- Basic notifications
- Guide trip check-in/out

**Users**: 1 company, <100 staff

### Phase 2: Advanced Workflows
**Timeline**: +6-8 weeks

**Features**:
- Waitlist automation
- Issue reporting + resolution
- Media uploads
- Broadcast messaging
- Advanced permissions
- Multi-turn conversations

**Users**: 5-10 companies, <500 staff

### Phase 3: Multi-Branch, Multi-Region Scale
**Timeline**: +8-12 weeks

**Features**:
- Multi-language support
- Regional templates
- Branch-specific routing
- Advanced analytics
- Performance optimization
- High-availability setup

**Users**: 50+ companies, unlimited staff

---

## ⚡ Why This Beats Travelopro / Rezdy

### Travelopro WhatsApp Booking
**Their Approach**: WhatsApp chatbot that creates bookings

**Limitations**:
- Chatbot-only (no operations control)
- Limited to customer-facing
- No staff workflows
- No field operations
- Separate from main system

### Rezdy WhatsApp Tools
**Their Approach**: Send booking confirmations via WhatsApp

**Limitations**:
- One-way notifications
- No two-way conversations
- No state management
- No role-based operations

### Our System
**Our Approach**: WhatsApp as full business control interface

**Advantages**:
1. **Unified Operations**: All roles, all workflows
2. **State-Driven**: Respects existing business rules
3. **Real-Time**: Instant dashboard updates
4. **Field-Ready**: Guides operate on the ground
5. **Scalable**: Provider-agnostic architecture
6. **Maintainable**: Clean separation of concerns

---

## 🔒 Security & Safety

### Idempotency
Every WhatsApp action is idempotent:
- Duplicate messages ignored
- Retry-safe operations
- Unique request IDs

### Rate Limiting
Per tenant, per user:
- Max messages per hour
- Max API calls per minute
- Burst allowances

### Abuse Prevention
- Phone number verification
- OTP for sensitive actions
- Automatic blocking for spam
- Manual review queue

### Data Privacy
- Phone numbers encrypted
- Messages stored encrypted
- Automatic cleanup (90 days)
- GDPR compliance ready

---

## 📊 Monitoring & Analytics

### Metrics
- Messages sent/received
- Conversation duration
- Conversion rate (enquiry → booking)
- Response time
- Error rate
- User satisfaction

### Alerts
- Webhook failures
- High error rates
- Suspicious activity
- Template rejections

---

## 🎓 Success Criteria

### For Business Owner
"WhatsApp replaces our messy Excel + WhatsApp chaos with organized operations."

### For Operations Team
"We control the business from our phones without losing visibility."

### For Field Staff
"We report issues instantly and get immediate support."

### For Engineers
"Clean, composable, and future-proof architecture."

---

**Version**: 1.0  
**Last Updated**: December 2024  
**Status**: Implementation Ready
