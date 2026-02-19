# WhatsApp Sales & Lead Automation System

## Overview

This document describes the enhanced WhatsApp Store system with advanced sales and lead automation capabilities. The system extends the existing store module with CRM, visual flow builder, smart automation, and AI-powered recommendations.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     WhatsApp Webhook                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  EnhancedStoreChatBot                            │
│  - Auto Lead Creation                                            │
│  - Flow Engine Integration                                       │
│  - Recommendation Engine                                         │
│  - Automation Triggers                                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Lead Module  │   │  Flow Module  │   │  Automation   │
│  (CRM Layer)  │   │ (Flow Builder)│   │   Module      │
└───────────────┘   └───────────────┘   └───────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  Recommendation       │
                │  Engine               │
                └───────────────────────┘
```

## Modules

### 1. Lead Module (`/modules/lead/`)

**Purpose:** CRM layer for managing WhatsApp leads

**Files:**
- `lead.types.ts` - TypeScript interfaces and enums
- `lead.model.ts` - Sequelize models (Lead, LeadActivity)
- `lead.repository.ts` - Database operations
- `lead.service.ts` - Business logic with scoring rules
- `lead.controller.ts` - HTTP handlers
- `lead.routes.ts` - Express routes
- `index.ts` - Module exports

**Features:**
- Auto lead creation from WhatsApp conversations
- Lead scoring with configurable rules
- Status progression tracking
- Data capture from flows
- Activity history logging
- Tag management
- Bulk operations

**API Endpoints:**
```
GET    /api/leads              - List leads with filters
GET    /api/leads/:id          - Get lead details
POST   /api/leads              - Create lead
PUT    /api/leads/:id          - Update lead
DELETE /api/leads/:id          - Delete lead
PUT    /api/leads/:id/status   - Update lead status
POST   /api/leads/:id/tags     - Add tags
DELETE /api/leads/:id/tags     - Remove tags
POST   /api/leads/bulk/tags    - Bulk tag operations
GET    /api/leads/stats        - Lead statistics
```

---

### 2. Flow Module (`/modules/flow/`)

**Purpose:** Visual flow builder for automated conversations

**Files:**
- `flow.types.ts` - Node types, triggers, session interfaces
- `flow.model.ts` - Sequelize models (Flow, FlowSession, FlowAnalytics)
- `flow.repository.ts` - Database operations with analytics
- `flow.engine.ts` - Core execution engine (~800 lines)
- `flow.service.ts` - Flow management with templates
- `flow.controller.ts` - HTTP handlers
- `flow.routes.ts` - Express routes
- `index.ts` - Module exports

**Node Types:**
| Type | Description |
|------|-------------|
| `message` | Send text/media message |
| `question` | Ask yes/no or choice question |
| `buttons` | Display button options |
| `list` | Display list picker |
| `input_capture` | Capture user input (name, email, phone, etc.) |
| `condition` | Branch based on conditions |
| `delay` | Wait before continuing |
| `product_catalog` | Show product categories |
| `product_list` | Show products in category |
| `product_detail` | Show product details |
| `add_to_cart` | Add product to cart |
| `show_cart` | Display current cart |
| `checkout` | Start checkout process |
| `assign_agent` | Trigger human takeover |
| `update_lead` | Update lead data |
| `trigger_automation` | Trigger automation rule |
| `api_call` | Make external API call |
| `end` | End flow |

**API Endpoints:**
```
GET    /api/flows                    - List flows
GET    /api/flows/:id                - Get flow
POST   /api/flows                    - Create flow
PUT    /api/flows/:id                - Update flow
DELETE /api/flows/:id                - Delete flow
POST   /api/flows/:id/activate       - Activate flow
POST   /api/flows/:id/deactivate     - Deactivate flow
POST   /api/flows/:id/duplicate      - Duplicate flow
POST   /api/flows/trigger            - Trigger flow manually
GET    /api/flows/sessions/:id       - Get session
POST   /api/flows/sessions/:id/input - Send input to session
GET    /api/flows/:id/analytics      - Get flow analytics
POST   /api/flows/templates/qualification - Create default flow
```

---

### 3. Automation Module (`/modules/automation/`)

**Purpose:** Smart automation rules for triggered actions

**Files:**
- `automation.types.ts` - Trigger types, actions, conditions
- `automation.model.ts` - Sequelize models (AutomationRule, AutomationExecution)
- `automation.repository.ts` - Database operations with cooldown checks
- `automation.engine.ts` - Execution engine with action handlers
- `automation.service.ts` - Rule management with templates
- `automation.controller.ts` - HTTP handlers
- `automation.routes.ts` - Express routes
- `index.ts` - Module exports

**Trigger Types:**
| Trigger | Description |
|---------|-------------|
| `no_reply` | Customer hasn't replied in X minutes |
| `cart_abandoned` | Cart abandoned for X minutes |
| `payment_pending` | Payment not received in X minutes |
| `order_completed` | Order marked as completed |
| `scheduled` | Run at specific time (cron) |
| `lead_score_changed` | Lead score crossed threshold |
| `status_changed` | Lead status changed |
| `tag_added` | Specific tag added to lead |
| `flow_completed` | Flow execution completed |
| `custom` | Custom webhook trigger |

**Action Types:**
| Action | Description |
|--------|-------------|
| `send_message` | Send WhatsApp message |
| `send_template` | Send template message |
| `trigger_flow` | Start a flow |
| `assign_agent` | Assign to human agent |
| `update_lead_status` | Update lead status |
| `update_lead_score` | Modify lead score |
| `add_tag` | Add tag to lead |
| `remove_tag` | Remove tag from lead |
| `webhook` | Call external webhook |
| `create_task` | Create follow-up task |

**API Endpoints:**
```
GET    /api/automation/rules         - List rules
GET    /api/automation/rules/:id     - Get rule
POST   /api/automation/rules         - Create rule
PUT    /api/automation/rules/:id     - Update rule
DELETE /api/automation/rules/:id     - Delete rule
POST   /api/automation/rules/:id/activate   - Activate rule
POST   /api/automation/rules/:id/deactivate - Deactivate rule
GET    /api/automation/executions/:id       - Get execution
GET    /api/automation/stats                - Get statistics
POST   /api/automation/templates/defaults   - Create default rules
```

---

### 4. Recommendation Module (`/modules/recommendation/`)

**Purpose:** AI-powered product recommendations

**Files:**
- `recommendation.types.ts` - Strategies, interactions, analytics interfaces
- `recommendation.model.ts` - Sequelize models (ProductInteraction, ProductAnalytics, LeadPreferences)
- `recommendation.repository.ts` - Database operations with aggregations
- `recommendation.engine.ts` - Recommendation algorithms
- `recommendation.service.ts` - Business logic
- `recommendation.controller.ts` - HTTP handlers
- `recommendation.routes.ts` - Express routes
- `index.ts` - Module exports

**Recommendation Strategies:**
| Strategy | Description |
|----------|-------------|
| `interest_based` | Based on captured lead interests |
| `budget_based` | Filtered by price range |
| `popularity` | Most viewed/purchased products |
| `similar_products` | Products similar to current |
| `past_purchases` | Based on purchase history |
| `cart_based` | Complementary to cart items |
| `trending` | Recently popular products |
| `new_arrivals` | Newest products |
| `complementary` | Frequently bought together |
| `upsell` | Higher-tier alternatives |
| `cross_sell` | Products from other categories |

**API Endpoints:**
```
GET    /api/recommendations              - Get recommendations
GET    /api/recommendations/personalized/:leadId - Personalized
GET    /api/recommendations/similar/:productId   - Similar products
POST   /api/recommendations/cart         - Cart-based recommendations
GET    /api/recommendations/upsell/:productId    - Upsell products
GET    /api/recommendations/trending     - Trending products
POST   /api/recommendations/track        - Track interaction
POST   /api/recommendations/track/view   - Track view
POST   /api/recommendations/track/cart   - Track cart add
POST   /api/recommendations/track/purchase - Track purchase
GET    /api/recommendations/analytics/popular - Popular products
GET    /api/recommendations/analytics/conversion/:productId - Stats
GET    /api/recommendations/preferences/:leadId - Lead preferences
PUT    /api/recommendations/preferences/:leadId/interests - Update interests
PUT    /api/recommendations/preferences/:leadId/budget - Update budget
```

---

### 5. Enhanced Store Chatbot (`/modules/store/store.chatbot.enhanced.ts`)

**Purpose:** Integrates all modules into the WhatsApp chatbot

**Features:**
- Extends base `StoreChatBot` class
- Auto creates leads from conversations
- Executes flows triggered by keywords
- Shows personalized recommendations
- Tracks product interactions
- Triggers automation rules
- Handles abandoned cart sessions

**Enhanced Keywords:**
| Keyword | Action |
|---------|--------|
| `recommend`, `suggest` | Show personalized recommendations |
| `similar` | Show similar products (when viewing) |
| `trending`, `popular` | Show trending products |
| `under ₹X`, `budget X` | Show budget-filtered products |

---

## Database Schema

**New Tables:**
1. `leads` - Lead/customer records
2. `lead_activities` - Activity history
3. `flows` - Flow definitions
4. `flow_sessions` - Active flow sessions
5. `flow_analytics` - Flow performance metrics
6. `automation_rules` - Automation rule definitions
7. `automation_executions` - Execution logs
8. `product_interactions` - User interaction tracking
9. `product_analytics` - Aggregated product metrics
10. `lead_preferences` - Cached lead preferences

**Migration:** `db/migrations/20250101000001-create-whatsapp-sales-automation-tables.ts`

---

## Usage Examples

### 1. Auto Lead Creation
```typescript
// Lead is automatically created when customer messages
const lead = await leadService.findOrCreateFromWhatsApp(
    tenantId,
    phone,
    { name: 'John', source: LeadSource.WHATSAPP }
);
```

### 2. Trigger a Flow
```typescript
// Start a flow for a customer
const result = await flowEngine.startFlow(
    tenantId,
    flowId,
    phone,
    { leadId: lead.id }
);
```

### 3. Get Recommendations
```typescript
// Get personalized recommendations
const recommendations = await recommendationService.getPersonalizedRecommendations(
    tenantId,
    leadId,
    { limit: 5 }
);
```

### 4. Create Automation Rule
```typescript
// Create cart abandonment rule
const rule = await automationService.createRule(tenantId, {
    name: 'Cart Abandonment Reminder',
    triggerType: AutomationTriggerType.CART_ABANDONED,
    triggerConfig: { delayMinutes: 30 },
    actions: [{
        type: AutomationActionType.SEND_MESSAGE,
        config: { message: 'You left items in your cart! Complete your order now.' }
    }]
});
```

---

## Default Templates

### Qualification Flow
The system includes a default qualification flow that:
1. Welcomes the customer
2. Asks for their name
3. Asks for interests
4. Asks for budget
5. Shows personalized recommendations
6. Offers catalog browsing

### Default Automation Rules
1. **Cart Abandonment Reminder** - Sends message after 30 minutes
2. **Payment Pending Reminder** - Sends reminder after 60 minutes
3. **No Reply Follow-up** - Follows up after 24 hours
4. **Repeat Visitor Boost** - Increases lead score for returning customers

---

## Integration Points

### WhatsApp Webhook Handler
```typescript
// In your webhook handler
const reply = await enhancedChatBot.processMessageEnhanced(
    tenantId,
    phone,
    messageText,
    settings,
    { name: customerName, profilePicUrl }
);

if (reply) {
    await whatsappService.sendMessage(phone, reply);
}
```

### Background Jobs
```typescript
// Process pending automations
await automationEngine.processPendingExecutions(tenantId);

// Check for abandoned carts
const abandoned = chatBot.getAbandonedCartSessions(30 * 60 * 1000);
for (const { tenantId, phone, session } of abandoned) {
    await automationEngine.checkTriggersForLead(tenantId, session.leadId, {
        triggerType: 'cart_abandoned',
        context: { cart: session.cartItems }
    });
}
```

---

## Multi-Tenant Support

All modules support multi-tenancy:
- Every table has a `tenant_id` column
- All queries are scoped by tenant
- Unique constraints include tenant scope
- Indexes optimize tenant-scoped queries
