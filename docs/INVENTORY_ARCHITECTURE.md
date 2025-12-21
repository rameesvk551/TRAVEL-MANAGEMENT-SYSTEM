# Travel Inventory & Booking Management System
## **THE DEPARTURE-CENTRIC ARCHITECTURE**

> *"Think in DEPARTURES, not Tours. Every slot is sacred inventory."*

---

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Website   │  │ Admin Panel │  │  OTA Sync   │  │  WhatsApp   │        │
│  │   Booking   │  │   Drawer    │  │   Worker    │  │   Bot/API   │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                │                │                │                │
│         └────────────────┴────────────────┴────────────────┘                │
│                                   │                                          │
│                          ┌────────▼────────┐                                │
│                          │   Unified API   │                                │
│                          │    Gateway      │                                │
│                          └────────┬────────┘                                │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┼────────────────────────────────────────┐
│                           APPLICATION LAYER                                  │
│  ┌─────────────────────────────────▼──────────────────────────────────────┐ │
│  │                      BOOKING ORCHESTRATOR                               │ │
│  │   • Single entry point for ALL booking channels                        │ │
│  │   • Coordinates inventory lock → payment → confirmation                │ │
│  │   • Source is METADATA, not logic                                      │ │
│  └─────────────────────────────────┬──────────────────────────────────────┘ │
│                                    │                                         │
│  ┌─────────────┬──────────────────┬┴─────────────┬─────────────────────────┐│
│  │  Inventory  │    Booking       │   Payment    │    Notification         ││
│  │   Service   │    Service       │   Service    │    Service              ││
│  │  (ATOMIC)   │  (Lifecycle)     │  (Async)     │    (Events)             ││
│  └──────┬──────┴────────┬─────────┴──────┬───────┴──────────┬──────────────┘│
│         │               │                │                  │                │
└─────────┼───────────────┼────────────────┼──────────────────┼────────────────┘
          │               │                │                  │
┌─────────┼───────────────┼────────────────┼──────────────────┼────────────────┐
│         │          DOMAIN LAYER          │                  │                │
│  ┌──────▼──────┐  ┌─────▼─────┐  ┌───────▼───────┐  ┌──────▼──────┐        │
│  │  Departure  │  │  Booking  │  │    Payment    │  │   Domain    │        │
│  │  Inventory  │  │  Entity   │  │    Entity     │  │   Events    │        │
│  │   Entity    │  │           │  │               │  │             │        │
│  └─────────────┘  └───────────┘  └───────────────┘  └─────────────┘        │
└──────────────────────────────────────────────────────────────────────────────┘
          │               │                │                  │
┌─────────┼───────────────┼────────────────┼──────────────────┼────────────────┐
│         │       INFRASTRUCTURE LAYER     │                  │                │
│  ┌──────▼──────┐  ┌─────▼─────┐  ┌───────▼───────┐  ┌──────▼──────┐        │
│  │  Inventory  │  │  Booking  │  │   Payment     │  │    Event    │        │
│  │    Repo     │  │   Repo    │  │   Gateway     │  │     Bus     │        │
│  │ (SERIALIZED)│  │           │  │   Adapter     │  │   (Queue)   │        │
│  └──────┬──────┘  └───────────┘  └───────────────┘  └─────────────┘        │
│         │                                                                    │
│  ┌──────▼──────────────────────────────────────────────────────────────────┐│
│  │                    PostgreSQL (Row-Level Locking)                        ││
│  │  • SELECT FOR UPDATE on departure rows                                   ││
│  │  • Optimistic locking with version column                                ││
│  │  • Atomic inventory operations via stored procedures                     ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                    │
│  │     Redis     │  │   Job Queue   │  │  Event Store  │                    │
│  │  (Hold TTL)   │  │ (Hold Expiry) │  │   (Audit)     │                    │
│  └───────────────┘  └───────────────┘  └───────────────┘                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Domain Models (Conceptual)

### 2.1 The Departure Instance Entity

> **CORE INSIGHT**: A "Tour" is a TEMPLATE. A "Departure" is INVENTORY.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DEPARTURE INSTANCE                                    │
│  ═══════════════════════════════════════════════════════════════════════    │
│                                                                              │
│  Identity                                                                    │
│  ─────────                                                                   │
│  • departure_id (UUID)                                                       │
│  • resource_id (FK → Tour/Trek/Activity template)                           │
│  • tenant_id                                                                 │
│  • departure_date (DATE)                                                     │
│  • departure_time (TIME, optional)                                          │
│                                                                              │
│  Capacity Management                                                         │
│  ───────────────────                                                         │
│  • total_capacity        = 40    (max seats ever)                           │
│  • blocked_seats         = 5     (staff/VIP reserves)                       │
│  • sellable_capacity     = 35    (total - blocked)                          │
│  • held_seats            = 3     (time-bound locks)                         │
│  • confirmed_seats       = 28    (paid/approved)                            │
│  • available_seats       = 4     (sellable - held - confirmed)              │
│  • overbooking_limit     = 2     (allowed oversell)                         │
│  • waitlist_count        = 0     (waiting for cancellations)                │
│                                                                              │
│  Channel Allocation (Optional Advanced)                                      │
│  ─────────────────────────────────────                                       │
│  • website_quota         = 15                                                │
│  • ota_quota             = 10                                                │
│  • manual_quota          = 10                                                │
│                                                                              │
│  Status                                                                      │
│  ──────                                                                      │
│  • status: SCHEDULED | OPEN | FEW_LEFT | FULL | WAITLIST | CLOSED | DEPARTED│
│  • cutoff_datetime (no bookings after this)                                 │
│  • min_participants (for guaranteed departure)                              │
│  • is_guaranteed (boolean)                                                  │
│                                                                              │
│  Version Control (Optimistic Locking)                                        │
│  ─────────────────────────────────────                                       │
│  • version (INTEGER, incremented on every update)                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

Formula: available_seats = sellable_capacity - held_seats - confirmed_seats
```

### 2.2 Inventory Hold Entity

> **PURPOSE**: Time-bound seat reservation before payment

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INVENTORY HOLD                                     │
│  ═══════════════════════════════════════════════════════════════════════    │
│                                                                              │
│  • hold_id (UUID)                                                           │
│  • departure_id (FK)                                                        │
│  • booking_id (FK, nullable - set when booking created)                     │
│  • seat_count (INTEGER)                                                     │
│  • source: WEBSITE | ADMIN | OTA | MANUAL                                   │
│  • hold_type: CART | PAYMENT_PENDING | APPROVAL_PENDING                     │
│  • expires_at (TIMESTAMPTZ) ← CRITICAL                                      │
│  • created_at                                                               │
│  • created_by_id (user who created hold)                                    │
│                                                                              │
│  TTL Rules:                                                                  │
│  ──────────                                                                  │
│  • CART holds: 15 minutes                                                   │
│  • PAYMENT_PENDING: 30 minutes                                              │
│  • APPROVAL_PENDING (staff): 24 hours                                       │
│  • OTA holds: Based on OTA contract                                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Enhanced Booking Entity

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BOOKING ENTITY (Enhanced)                            │
│  ═══════════════════════════════════════════════════════════════════════    │
│                                                                              │
│  Identity                                                                    │
│  ─────────                                                                   │
│  • booking_id (UUID)                                                        │
│  • booking_number (Human-readable: TRK-2024-00001)                          │
│  • tenant_id                                                                │
│  • departure_id (FK) ← Links to inventory                                   │
│  • resource_id (FK)  ← For reporting/grouping                               │
│                                                                              │
│  Source Tracking (Metadata, NOT Logic)                                       │
│  ─────────────────────────────────────                                       │
│  • source: WEBSITE | OTA | MANUAL | WHATSAPP | PHONE | EMAIL                │
│  • source_platform: 'viator' | 'booking.com' | 'direct' | null              │
│  • external_ref: OTA booking reference                                      │
│  • channel_agent_id: Which staff member / bot                               │
│                                                                              │
│  Lifecycle Status                                                            │
│  ────────────────                                                            │
│  • status: DRAFT | HELD | PENDING_PAYMENT | CONFIRMED |                     │
│            PENDING_APPROVAL | CANCELLED | REFUNDED | NO_SHOW | COMPLETED    │
│  • status_reason: 'payment_failed' | 'customer_request' | 'overbooking'     │
│  • hold_id (FK, nullable) ← Reference to active hold                        │
│  • hold_expires_at                                                          │
│                                                                              │
│  Guest Details                                                               │
│  ─────────────                                                               │
│  • primary_guest: { name, email, phone, nationality, passport }             │
│  • additional_guests: [{ name, age, requirements }]                         │
│  • participant_count                                                        │
│  • special_requirements: dietary, medical, accessibility                    │
│                                                                              │
│  Pricing                                                                     │
│  ───────                                                                     │
│  • unit_price                                                               │
│  • participant_count                                                        │
│  • subtotal                                                                 │
│  • discount_code                                                            │
│  • discount_amount                                                          │
│  • tax_amount                                                               │
│  • total_amount                                                             │
│  • currency                                                                 │
│  • amount_paid (for partial payment tracking)                               │
│  • amount_due                                                               │
│                                                                              │
│  Timestamps                                                                  │
│  ──────────                                                                  │
│  • created_at, updated_at                                                   │
│  • confirmed_at                                                             │
│  • cancelled_at                                                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.4 Payment Entity

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PAYMENT ENTITY                                      │
│  ═══════════════════════════════════════════════════════════════════════    │
│                                                                              │
│  • payment_id (UUID)                                                        │
│  • booking_id (FK)                                                          │
│  • tenant_id                                                                │
│                                                                              │
│  • payment_type: FULL | PARTIAL | DEPOSIT | BALANCE                         │
│  • method: CARD | UPI | BANK_TRANSFER | CASH | CHEQUE | OTA_COLLECT         │
│  • status: PENDING | PROCESSING | COMPLETED | FAILED | REFUNDED             │
│                                                                              │
│  • amount                                                                   │
│  • currency                                                                 │
│  • gateway: 'razorpay' | 'stripe' | 'paypal' | 'manual'                     │
│  • gateway_ref                                                              │
│  • gateway_response (JSONB)                                                 │
│                                                                              │
│  • payment_link_id (for async payment links)                                │
│  • link_expires_at                                                          │
│  • link_url                                                                 │
│                                                                              │
│  • received_by_id (staff who recorded manual payment)                       │
│  • notes                                                                    │
│                                                                              │
│  • created_at, completed_at, failed_at                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Inventory State Machine

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     DEPARTURE INVENTORY STATE MACHINE                        │
│  ═══════════════════════════════════════════════════════════════════════    │
│                                                                              │
│                              ┌───────────┐                                   │
│                              │ SCHEDULED │                                   │
│                              │(Future)   │                                   │
│                              └─────┬─────┘                                   │
│                                    │ open_for_sale()                         │
│                                    ▼                                         │
│                              ┌───────────┐                                   │
│                              │   OPEN    │◄─────────────────┐                │
│                              │(Selling)  │                  │                │
│                              └─────┬─────┘                  │                │
│                                    │                        │                │
│              ┌─────────────────────┼─────────────────────┐  │                │
│              │ available < 20%     │ available = 0       │  │                │
│              ▼                     ▼                     │  │                │
│        ┌───────────┐         ┌───────────┐              │  │                │
│        │ FEW_LEFT  │         │   FULL    │──────────────┘  │                │
│        │(Urgency)  │         │           │ cancellation    │                │
│        └─────┬─────┘         └─────┬─────┘ releases seats  │                │
│              │ available = 0       │                       │                │
│              └──────────┬──────────┘                       │                │
│                         │ enable_waitlist()                │                │
│                         ▼                                  │                │
│                   ┌───────────┐                            │                │
│                   │ WAITLIST  │────────────────────────────┘                │
│                   │           │ seat becomes available                      │
│                   └─────┬─────┘                                             │
│                         │ close_booking()                                   │
│                         ▼                                                   │
│                   ┌───────────┐                                             │
│                   │  CLOSED   │                                             │
│                   │(Cutoff)   │                                             │
│                   └─────┬─────┘                                             │
│                         │ departure_date reached                            │
│                         ▼                                                   │
│                   ┌───────────┐                                             │
│                   │ DEPARTED  │                                             │
│                   │(Complete) │                                             │
│                   └───────────┘                                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

Auto-Transition Rules:
─────────────────────
• OPEN → FEW_LEFT: When available_seats < (sellable_capacity * 0.2)
• FEW_LEFT → FULL: When available_seats = 0
• FULL → OPEN/FEW_LEFT: When cancellation releases seats
• ANY → CLOSED: When current_time > cutoff_datetime
• CLOSED → DEPARTED: When current_date = departure_date
```

---

## 4. Booking Lifecycle Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BOOKING LIFECYCLE STATE MACHINE                       │
│  ═══════════════════════════════════════════════════════════════════════    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                          HAPPY PATH                                      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│    Customer          System              Inventory          Payment          │
│    ────────          ──────              ─────────          ───────          │
│        │                │                    │                  │            │
│        │ Select Tour    │                    │                  │            │
│        │───────────────►│                    │                  │            │
│        │                │                    │                  │            │
│        │                │ Check Availability │                  │            │
│        │                │───────────────────►│                  │            │
│        │                │                    │                  │            │
│        │                │◄──────────────────┤│ 4 seats available│            │
│        │                │                    │                  │            │
│        │ Add to Cart    │                    │                  │            │
│        │───────────────►│                    │                  │            │
│        │                │                    │                  │            │
│        │                │ CREATE HOLD (15min)│                  │            │
│        │                │───────────────────►│                  │            │
│        │                │                    │ LOCK 2 SEATS     │            │
│        │                │                    │ held_seats += 2  │            │
│        │                │                    │                  │            │
│        │                │ Booking: HELD      │                  │            │
│        │◄───────────────│                    │                  │            │
│        │                │                    │                  │            │
│        │ Enter Details  │                    │                  │            │
│        │ Click Pay      │                    │                  │            │
│        │───────────────►│                    │                  │            │
│        │                │                    │                  │            │
│        │                │ Extend Hold (30min)│                  │            │
│        │                │───────────────────►│                  │            │
│        │                │                    │                  │            │
│        │                │ Initiate Payment   │                  │            │
│        │                │───────────────────────────────────────►│           │
│        │                │                    │                  │            │
│        │                │ Booking: PENDING_PAYMENT              │            │
│        │                │                    │                  │            │
│        │                │◄──────────────────────────────────────│            │
│        │                │                    │ Payment Success  │            │
│        │                │                    │                  │            │
│        │                │ CONFIRM BOOKING    │                  │            │
│        │                │───────────────────►│                  │            │
│        │                │                    │ RELEASE HOLD     │            │
│        │                │                    │ held_seats -= 2  │            │
│        │                │                    │ confirmed += 2   │            │
│        │                │                    │                  │            │
│        │                │ Booking: CONFIRMED │                  │            │
│        │◄───────────────│                    │                  │            │
│        │                │                    │                  │            │
│        │ Email + SMS    │                    │                  │            │
│        │◄───────────────│                    │                  │            │
│        │                │                    │                  │            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         FAILURE PATHS                                        │
│  ═══════════════════════════════════════════════════════════════════════    │
│                                                                              │
│  SCENARIO 1: Hold Expires                                                    │
│  ─────────────────────────                                                   │
│  • User adds to cart, goes for coffee                                       │
│  • 15 minutes pass                                                          │
│  • Cron Job / Queue Worker runs                                             │
│  • Hold record deleted                                                      │
│  • Inventory: held_seats -= 2                                               │
│  • Booking: HELD → EXPIRED                                                  │
│  • Seats return to pool                                                     │
│                                                                              │
│  SCENARIO 2: Payment Fails                                                   │
│  ─────────────────────────                                                   │
│  • User clicks pay                                                          │
│  • Gateway returns failure                                                  │
│  • Booking: PENDING_PAYMENT → HELD (can retry)                              │
│  • Hold remains active until expiry                                         │
│  • User can retry payment                                                   │
│  • After 3 failures → CANCELLED, hold released                              │
│                                                                              │
│  SCENARIO 3: Gateway Timeout (Network Failure)                               │
│  ──────────────────────────────────────────────                              │
│  • Payment request sent                                                     │
│  • No response received                                                     │
│  • Booking: PENDING_PAYMENT → PAYMENT_UNCERTAIN                             │
│  • DO NOT release hold                                                      │
│  • Background job queries gateway for status                                │
│  • Webhook from gateway resolves state                                      │
│  • Never double-charge, never lose booking                                  │
│                                                                              │
│  SCENARIO 4: User Cancels                                                    │
│  ────────────────────────                                                    │
│  • Booking: CONFIRMED → CANCELLED                                           │
│  • Inventory: confirmed_seats -= 2                                          │
│  • Waitlist notified (if any)                                               │
│  • Refund initiated (based on policy)                                       │
│                                                                              │
│  SCENARIO 5: OTA Delayed Booking                                             │
│  ────────────────────────────────                                            │
│  • OTA sends booking notification 2 hours late                              │
│  • Check departure inventory                                                │
│  • If available → Accept, confirm normally                                  │
│  • If not available:                                                        │
│    - Check overbooking_limit                                                │
│    - If within limit → Accept with OVERBOOKING flag                         │
│    - If beyond limit → REJECT, notify OTA, alert staff                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. UI/UX Screen Breakdown

### 5.1 Inventory Dashboard (Main View)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ┌─ SIDEBAR ─┐                    INVENTORY DASHBOARD                         │
│ │ Dashboard │  ┌─────────────────────────────────────────────────────────┐  │
│ │ Inventory │  │ December 2024                        < Today >          │  │
│ │ Bookings  │  └─────────────────────────────────────────────────────────┘  │
│ │ Leads     │                                                               │
│ │ Reports   │  ┌─────────────────────────────────────────────────────────┐  │
│ │ Settings  │  │ Filter: [All Tours ▼] [All Status ▼] [Search...]       │  │
│ └───────────┘  └─────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  CALENDAR VIEW                                                          ││
│  │  ═══════════════════════════════════════════════════════════════════   ││
│  │                                                                         ││
│  │  ┌──────────────────────────────────────────────────────────────────┐  ││
│  │  │        Sun   Mon   Tue   Wed   Thu   Fri   Sat                   │  ││
│  │  ├──────────────────────────────────────────────────────────────────┤  ││
│  │  │                                                                   │  ││
│  │  │  Everest Trek     ●15    ●28    ●35    ●40    ○      ○      ●8   │  ││
│  │  │  40 capacity      OPEN   FEW    FULL  FULL         CLOSED  OPEN  │  ││
│  │  │                   ████   ████   ████  ████                ██     │  ││
│  │  │                                                                   │  ││
│  │  │  Annapurna Trek   ●20    ○      ●30    ●30   ●25    ○      ●12   │  ││
│  │  │  30 capacity      OPEN          FULL  FULL  WAIT         OPEN   │  ││
│  │  │                   ████          ████  ████  ████         ███     │  ││
│  │  │                                                                   │  ││
│  │  │  Paragliding      ●4     ●6     ●6     ●5    ●4     ●3     ●2    │  ││
│  │  │  6 capacity       OPEN   FULL   FULL   FEW   OPEN   OPEN   OPEN  │  ││
│  │  │                   ████   ████   ████   ████  ████   ███    ██     │  ││
│  │  │                                                                   │  ││
│  │  └──────────────────────────────────────────────────────────────────┘  ││
│  │                                                                         ││
│  │  Legend: ● Has bookings  ○ No departures  ████ Capacity bar            ││
│  │          █ Confirmed  ▓ Held  ░ Available  Status color-coded          ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  HOVER: Everest Trek - Dec 15                                           ││
│  │  ════════════════════════════════                                       ││
│  │  Total: 40  |  Blocked: 5  |  Sellable: 35                             ││
│  │  ┌──────────────────────────────────┐                                  ││
│  │  │ Confirmed  │████████████████│ 28 │                                  ││
│  │  │ Website    │████████        │ 12 │                                  ││
│  │  │ OTA        │██████          │  8 │                                  ││
│  │  │ Manual     │████████        │  8 │                                  ││
│  │  ├──────────────────────────────────┤                                  ││
│  │  │ Held       │██              │  3 │ (expires in 12min)               ││
│  │  │ Available  │████            │  4 │                                  ││
│  │  └──────────────────────────────────┘                                  ││
│  │  Overbooking: 2 allowed  |  Waitlist: 0                                ││
│  │                                                                         ││
│  │  [View Bookings]  [Add Manual Booking]  [Block Seats]                  ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Unified Booking Drawer (Used by ALL channels)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                            [ X Close ]       │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  NEW BOOKING                                                            ││
│  │  Everest Base Camp Trek - Dec 15, 2024                                  ││
│  │  ════════════════════════════════════════════════════                   ││
│  │                                                                         ││
│  │  Availability: 4 seats remaining (3 held by others)                     ││
│  │  ████████████████████████████████░░░░░░░░                               ││
│  │  28 confirmed          3 held    4 available                            ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  BOOKING SOURCE                                                         ││
│  │  ─────────────                                                          ││
│  │  ○ Website (Direct)   ○ WhatsApp   ○ Phone   ○ Walk-in                 ││
│  │  ○ OTA (Viator)       ○ OTA (GYG)  ○ Email   ○ Referral                ││
│  │                                                                         ││
│  │  External Reference: [_________________________]                        ││
│  │  (OTA booking ID, enquiry reference, etc.)                             ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  GUEST DETAILS                                                          ││
│  │  ─────────────                                                          ││
│  │  Number of Participants: [  2  ▼ ]                                      ││
│  │                                                                         ││
│  │  Primary Guest                                                          ││
│  │  Name:    [John Doe_____________________]                              ││
│  │  Email:   [john@email.com_______________]                              ││
│  │  Phone:   [+1 555 123 4567______________]                              ││
│  │  Country: [United States ▼]                                             ││
│  │                                                                         ││
│  │  [ + Add Additional Participant ]                                       ││
│  │                                                                         ││
│  │  Special Requirements:                                                  ││
│  │  ┌───────────────────────────────────────────────────────────────────┐ ││
│  │  │ Vegetarian meals, mild altitude sickness history                  │ ││
│  │  └───────────────────────────────────────────────────────────────────┘ ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  PRICING                                                                ││
│  │  ───────                                                                ││
│  │  Unit Price:              $1,200.00 × 2 =          $2,400.00           ││
│  │  Discount (EARLY10):                                 -$240.00           ││
│  │  Subtotal:                                         $2,160.00           ││
│  │  Tax (18% GST):                                      $388.80           ││
│  │  ──────────────────────────────────────────────────────────            ││
│  │  TOTAL:                                            $2,548.80           ││
│  │                                                                         ││
│  │  Apply Discount: [__________] [Apply]                                   ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  PAYMENT                                                                ││
│  │  ───────                                                                ││
│  │  ○ Full Payment Now                                                    ││
│  │  ● Deposit (30%): $764.64 now, $1,784.16 due before Dec 1              ││
│  │  ○ Send Payment Link (valid 48 hours)                                  ││
│  │  ○ Record Manual Payment (cash/bank transfer)                          ││
│  │  ○ Mark as Paid (OTA will collect)                                     ││
│  │                                                                         ││
│  │  Manual Payment Details (if selected):                                  ││
│  │  Method: [Cash ▼]  Amount: [$________]  Reference: [__________]        ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  STAFF NOTES (Internal)                                                 ││
│  │  ┌───────────────────────────────────────────────────────────────────┐ ││
│  │  │ Customer called via WhatsApp. Very interested in photography.     │ ││
│  │  │ Mentioned by friend who did trek last month.                      │ ││
│  │  └───────────────────────────────────────────────────────────────────┘ ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                                                                         ││
│  │  ⚠️  Creating this booking will hold 2 seats for 30 minutes.           ││
│  │      Seats will be released if payment is not completed.               ││
│  │                                                                         ││
│  │  [ Cancel ]                              [ Create Booking & Process → ] ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Departure Detail View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  ← Back to Inventory                                                        │
│                                                                              │
│  EVEREST BASE CAMP TREK                                                      │
│  December 15, 2024                                                           │
│  ══════════════════════════════════════════════════════════════════════════ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  CAPACITY OVERVIEW                                                       ││
│  │  ──────────────────                                                     ││
│  │                                                                         ││
│  │  ┌─────────────────────────────────────────────────────────────────┐   ││
│  │  │                                                                 │   ││
│  │  │  ████████████████████████████████████████████░░░░░░░░░░░░░░    │   ││
│  │  │  █████████ Confirmed (28) ██████████ █ Held (3) █ Avail (4)    │   ││
│  │  │                                                                 │   ││
│  │  └─────────────────────────────────────────────────────────────────┘   ││
│  │                                                                         ││
│  │  Total: 40  →  Blocked: 5  →  Sellable: 35  →  Available: 4            ││
│  │                                                                         ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐││
│  │  │   Website    │  │     OTA      │  │    Manual    │  │   Waitlist   │││
│  │  │      12      │  │       8      │  │       8      │  │       0      │││
│  │  │   ████████   │  │    ██████    │  │    ██████    │  │              │││
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘││
│  │                                                                         ││
│  │  Overbooking Limit: 2 (0 used)   |   Status: OPEN                      ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  ACTIVE HOLDS (3)                                              [Refresh]││
│  │  ════════════════                                                       ││
│  │                                                                         ││
│  │  │ Guest          │ Seats │ Source   │ Expires In  │ Action          │ ││
│  │  ├────────────────┼───────┼──────────┼─────────────┼─────────────────┤ ││
│  │  │ John Doe       │   2   │ Website  │ 12 min      │ [Extend][Cancel]│ ││
│  │  │ (Payment Page) │       │          │ ████░░░░░░  │                 │ ││
│  │  ├────────────────┼───────┼──────────┼─────────────┼─────────────────┤ ││
│  │  │ Admin (Priya)  │   1   │ WhatsApp │ 23 hours    │ [Extend][Cancel]│ ││
│  │  │ Awaiting docs  │       │          │ █████████░  │                 │ ││
│  │  └────────────────┴───────┴──────────┴─────────────┴─────────────────┘ ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  CONFIRMED BOOKINGS (28)                     [Export] [+ Add Booking]  ││
│  │  ══════════════════════                                                 ││
│  │                                                                         ││
│  │  │ Booking #      │ Guest        │ Pax │ Source    │ Amount   │ Status│││
│  │  ├────────────────┼──────────────┼─────┼───────────┼──────────┼───────┤││
│  │  │ TRK-2024-00142 │ Alice Smith  │  2  │ Website   │ $2,400   │ PAID  │││
│  │  │ TRK-2024-00138 │ Bob Johnson  │  4  │ Viator    │ $4,800   │ PAID  │││
│  │  │ TRK-2024-00135 │ Team Xcorp   │  6  │ Manual    │ $7,200   │ PARTIAL│││
│  │  │ TRK-2024-00131 │ Maria Garcia │  3  │ GYG       │ $3,600   │ PAID  │││
│  │  │ ...            │              │     │           │          │       │││
│  │  └────────────────┴──────────────┴─────┴───────────┴──────────┴───────┘││
│  │                                                                         ││
│  │  Showing 1-10 of 28                              [1] [2] [3] [Next →]  ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  QUICK ACTIONS                                                          ││
│  │  ─────────────                                                          ││
│  │                                                                         ││
│  │  [📧 Email All Guests]  [📱 Send Reminder]  [🔒 Block Seats]            ││
│  │  [📊 Export Manifest]   [🚫 Close Booking]  [⚙️ Edit Departure]         ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Edge Cases & Failure Handling

### 6.1 Critical Edge Cases

| Scenario | Problem | Solution |
|----------|---------|----------|
| **Race Condition** | Two users book last seat simultaneously | Postgres `SELECT FOR UPDATE` + version check |
| **Hold Expiry During Payment** | User's hold expires while entering card details | Extend hold on payment initiation; if expired, re-check availability |
| **OTA Double Push** | OTA sends same booking twice | Idempotency key on `external_ref` + `source_platform` |
| **Payment Gateway Timeout** | No response from Razorpay/Stripe | Mark as PAYMENT_UNCERTAIN, query gateway async, honor webhook |
| **Staff Double Entry** | Staff creates duplicate booking via phone | Dedupe warning on guest phone/email + departure |
| **Overbooking Resolution** | Tour has 2 overbookings, 2 cancellations come in | Auto-reconcile: move overbooked to confirmed |
| **Waitlist Notification** | Seat opens, multiple waitlisted | First-come-first-served with time-limited hold |
| **Timezone Issues** | Departure is in Nepal, user is in US | Store all times in UTC, display in user's timezone |
| **Partial Payment Default** | User pays deposit, doesn't pay balance | Auto-reminder sequence, eventual cancellation policy |
| **OTA Cancellation** | OTA sends cancellation after departure | Reject if departed, auto-accept if within policy |

### 6.2 Failure Recovery Strategies

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FAILURE RECOVERY MATRIX                                 │
│  ═══════════════════════════════════════════════════════════════════════    │
│                                                                              │
│  PAYMENT FAILURES                                                            │
│  ────────────────                                                            │
│  Gateway Timeout:                                                            │
│    1. Set booking status = PAYMENT_UNCERTAIN                                │
│    2. Keep hold active                                                       │
│    3. Queue job: Poll gateway every 30s for 5 min                           │
│    4. If webhook arrives → process normally                                 │
│    5. If poll succeeds → update status accordingly                          │
│    6. If 5 min passes → Mark PAYMENT_UNKNOWN, alert staff                   │
│                                                                              │
│  Card Declined:                                                              │
│    1. Keep booking in HELD status                                           │
│    2. Allow retry (up to 3 times)                                           │
│    3. After 3 fails → CANCELLED, release hold                               │
│                                                                              │
│  DATABASE FAILURES                                                           │
│  ─────────────────                                                           │
│  Transaction Fails Mid-Booking:                                              │
│    1. All operations in single transaction                                  │
│    2. Rollback releases all locks                                           │
│    3. User sees error, can retry                                            │
│    4. No partial states possible                                            │
│                                                                              │
│  EXTERNAL SERVICE FAILURES                                                   │
│  ─────────────────────────                                                   │
│  Email Service Down:                                                         │
│    1. Booking still confirmed                                               │
│    2. Email queued for retry                                                │
│    3. Staff notified if >1 hour pending                                     │
│                                                                              │
│  OTA SYNC FAILURES                                                           │
│  ─────────────────                                                           │
│  OTA Push Fails:                                                             │
│    1. Booking exists locally                                                │
│    2. OTA marked as OUT_OF_SYNC                                             │
│    3. Retry queue with exponential backoff                                  │
│    4. Alert if >3 failures                                                  │
│    5. Manual reconciliation tool available                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Why This System Beats Existing ERPs

| Existing ERPs | This System |
|---------------|-------------|
| **Tour-centric** – Manage "tours" not inventory | **Departure-centric** – Each date is real inventory |
| **No holds** – Book = instant deduction | **Hold system** – Lock before payment |
| **Channel silos** – Separate OTA inventory | **Unified pool** – Single source of truth |
| **Manual reconciliation** – Daily Excel sync | **Atomic operations** – Real-time accuracy |
| **No race protection** – First-save-wins | **Database locking** – Guaranteed consistency |
| **Static status** – Available/Booked | **Dynamic states** – FEW_LEFT, WAITLIST |
| **Payment coupled** – Must pay to book | **Payment decoupled** – Book → Hold → Pay |
| **No partial payments** – Full or nothing | **Flexible payments** – Deposits, links, manual |
| **OTA as separate** – Different workflow | **OTA as metadata** – Same flow, different source |
| **No audit trail** – Who did what? | **Complete events** – Every action logged |

---

## 8. What Most Developers Get Wrong

### ❌ Common Mistakes

1. **Treating "Book" as a single action**
   - Wrong: `book()` → immediately deduct inventory
   - Right: `hold()` → `pay()` → `confirm()` → deduct

2. **Mixing availability check with booking**
   - Wrong: Check availability, then create booking (race condition!)
   - Right: Lock row, check, create, release lock (atomic)

3. **Using application-level locks**
   - Wrong: Redis lock for inventory
   - Right: Database row-level locks (survives crashes)

4. **Ignoring time zones**
   - Wrong: Store departure_date as DATE
   - Right: Store as TIMESTAMPTZ, convert on display

5. **Hardcoding OTA logic**
   - Wrong: `if (source === 'viator') { ... }`
   - Right: Source is metadata, logic is universal

6. **No hold expiry mechanism**
   - Wrong: Holds live forever
   - Right: Cron job + queue worker cleanup

7. **Optimistic UI without pessimistic backend**
   - Wrong: Show "Available" based on last fetch
   - Right: Re-check at booking time, show warnings

8. **Payment success = booking complete**
   - Wrong: Payment webhook → done
   - Right: Payment webhook → release hold → confirm → notify

---

## 9. Future-Proof Extensibility

### 9.1 Multi-Resource Bookings
```
Future: Book Trek + Hotel + Transfer as package
Solution: BookingGroup entity with linked BookingItems
Each item has its own hold, all must succeed
```

### 9.2 Dynamic Pricing
```
Future: Price varies by demand, season, channel
Solution: PricingRule entity with conditions
Evaluated at hold creation, locked for duration
```

### 9.3 Channel Quotas
```
Future: Limit OTA to 40% of inventory
Solution: ChannelAllocation on DepartureInstance
Enforced in hold creation logic
```

### 9.4 Yield Management
```
Future: Auto-adjust prices as capacity fills
Solution: CapacityTrigger rules
When <20% available → increase price 15%
```

### 9.5 Multi-Location Inventory
```
Future: Same trek offered from multiple cities
Solution: DepartureVariant linked to DepartureInstance
Each variant can have different pricing/pickup
```

### 9.6 Affiliate/Agent Bookings
```
Future: Travel agents book with commission tracking
Solution: Agent entity with commission rules
AgentBooking tracks commission owed
```

---

## 10. Implementation Priority

### Phase 1: Core Inventory (Week 1-2)
- [ ] DepartureInstance entity & repository
- [ ] Inventory hold/release operations
- [ ] Hold expiry job worker
- [ ] Basic booking flow with holds

### Phase 2: Multi-Channel (Week 3-4)
- [ ] Unified booking drawer UI
- [ ] Source metadata tracking
- [ ] OTA ingestion adapter (webhook receiver)
- [ ] Admin booking workflow

### Phase 3: Payments (Week 5-6)
- [ ] Payment entity & repository
- [ ] Payment link generation
- [ ] Partial payment tracking
- [ ] Gateway integration (Razorpay/Stripe)

### Phase 4: Resilience (Week 7-8)
- [ ] Payment failure recovery
- [ ] OTA sync reconciliation
- [ ] Audit logging
- [ ] Monitoring & alerts

---

## Summary

This architecture treats **inventory as a first-class citizen** with:

1. **Departure-centric model** – Real inventory, not abstract tours
2. **Time-bound holds** – Lock before payment, auto-release on expiry
3. **Atomic operations** – Database-level consistency, no race conditions
4. **Channel-agnostic** – Same flow for all sources, source is just metadata
5. **Failure-resilient** – Every failure mode has a recovery path
6. **Audit-complete** – Every action logged for reconciliation

The system is designed by someone who has been woken up at 3 AM because of double-bookings, lost revenue to race conditions, and spent weekends reconciling OTA mismatches.

**This is not a tutorial project. This is production-grade travel inventory management.**
