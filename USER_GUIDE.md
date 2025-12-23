# 🌍 Travel Management System - Complete User Guide

> **The Operating System for Travel Businesses**  
> *One platform to manage your tours, team, leads, and finances.*

---

## 📋 Table of Contents

1. [System Overview](#-system-overview)
2. [Getting Started](#-getting-started)
3. [Dashboard & Analytics](#-dashboard--analytics)
4. [CRM - Lead Management](#-crm---lead-management)
5. [Booking Engine](#-booking-engine)
6. [Inventory Management](#-inventory-management)
7. [Resource Management](#-resource-management)
8. [HRMS - People Management](#-hrms---people-management)
9. [Vendor & Supplier Management](#-vendor--supplier-management)
10. [WhatsApp Operations](#-whatsapp-operations)
11. [User Roles & Permissions](#-user-roles--permissions)
12. [Common Workflows](#-common-workflows)
13. [Tips & Best Practices](#-tips--best-practices)

---

## 🏢 System Overview

The **Travel Management System (TMS)** is an all-in-one platform designed specifically for travel businesses - whether you run treks, tours, adventure activities, or hospitality services. It replaces multiple disconnected tools (spreadsheets, CRMs, HR software) with a unified digital workspace.

### What You Can Do

| Module | Purpose | Who Uses It |
|--------|---------|-------------|
| **Dashboard** | Real-time business insights | Everyone |
| **CRM** | Capture and convert leads | Sales Team |
| **Bookings** | Manage reservations | Operations Team |
| **Inventory** | Control tour departures & seats | Operations Manager |
| **Resources** | Manage tours, hotels, vehicles | Admin |
| **HRMS** | Manage staff, attendance, payroll | HR & Employees |
| **Vendors** | Manage suppliers & settlements | Finance & Ops |
| **WhatsApp** | Automated communication | Sales & Ops |

### How It All Connects

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│    LEADS     │───▶│   BOOKINGS   │───▶│  DEPARTURES  │
│  (Inquiries) │    │(Reservations)│    │ (Inventory)  │
└──────────────┘    └──────────────┘    └──────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌──────────────────────────────────────────────────────┐
│                    DASHBOARD                          │
│           (See everything at a glance)               │
└──────────────────────────────────────────────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│     HRMS     │    │   VENDORS    │    │   WHATSAPP   │
│ (Staffing)   │    │ (Suppliers)  │    │ (Automation) │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## 🚀 Getting Started

### First-Time Login

1. **Open the Application**: Navigate to your company's TMS URL
2. **Enter Credentials**: Use the email and password provided by your admin
3. **Dashboard Loads**: You'll see your personalized dashboard based on your role

### Navigation

The main navigation is located in the **left sidebar**:

```
┌─────────────────┐
│ 🏠 Dashboard    │ ← Overview & Analytics
│ 📊 Dashboards   │ ← Custom Dashboard Builder
│ 👥 CRM          │ ← Leads & Pipeline
│ 📅 Bookings     │ ← Reservations
│ 📦 Inventory    │ ← Tour Departures
│ 🎒 Resources    │ ← Tours, Hotels, Vehicles
│ 👤 HRMS         │ ← People Management
│ 🤝 Vendors      │ ← Supplier Management
└─────────────────┘
```

---

## 📊 Dashboard & Analytics

### Main Dashboard

Your **Dashboard** is your command center. It shows real-time metrics tailored to your role:

#### For Managers/Owners
- **Total Revenue** - This month's earnings
- **Active Bookings** - Currently confirmed reservations
- **Lead Conversion Rate** - Percentage of leads becoming bookings
- **Upcoming Departures** - Tours happening soon

#### For Sales Team
- **My Leads** - Leads assigned to you
- **Pipeline Value** - Potential revenue in your pipeline
- **Tasks Due Today** - Follow-ups needed

### Custom Dashboard Builder

Create personalized dashboards with drag-and-drop widgets:

#### How to Create a Custom Dashboard

1. **Go to** `Dashboards → Dashboard Builder`
2. **Click** `Create New Dashboard`
3. **Name Your Dashboard** (e.g., "Sales Overview")
4. **Add Widgets** by dragging from the widget library:
   - **KPI Cards** - Show single metrics (revenue, bookings count)
   - **Charts** - Line charts, bar charts, pie charts
   - **Tables** - Data grids for detailed information
   - **Text** - Custom notes or instructions
5. **Arrange Layout** - Resize and position widgets
6. **Save** your dashboard

#### Widget Types Available

| Widget | What It Shows | Use Case |
|--------|--------------|----------|
| Revenue Card | Total revenue for period | Track earnings |
| Bookings Counter | Number of active bookings | Monitor volume |
| Conversion Chart | Lead-to-booking trends | Measure sales efficiency |
| Pipeline Funnel | Leads by stage | Sales forecasting |
| Departure Calendar | Upcoming tours | Operations planning |

---

## 👥 CRM - Lead Management

The CRM module helps you capture, nurture, and convert leads into paying customers.

### Understanding the Lead Pipeline

Every lead moves through stages:

```
┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
│    NEW     │───▶│ CONTACTED  │───▶│ QUALIFIED  │───▶│  QUOTED    │───▶│   WON      │
│            │    │            │    │            │    │            │    │ (Booked!)  │
└────────────┘    └────────────┘    └────────────┘    └────────────┘    └────────────┘
                                          │                                    
                                          ▼                                    
                                    ┌────────────┐                             
                                    │    LOST    │                             
                                    │            │                             
                                    └────────────┘                             
```

### Working with Leads

#### Creating a New Lead

1. **Navigate to** `CRM → Leads`
2. **Click** `+ New Lead`
3. **Fill in Details**:
   - **Name** - Customer's full name
   - **Email** - Primary contact email
   - **Phone** - Contact number with country code
   - **Source** - Where did they find you? (Website, Referral, Social Media)
   - **Interested In** - Which tour/service
   - **Budget** - Approximate budget range
   - **Travel Date** - When they want to travel
   - **Notes** - Any additional information
4. **Assign to** - Select the sales person responsible
5. **Save Lead**

#### The Pipeline Board (Kanban View)

The Pipeline Board lets you visualize all leads:

```
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│    NEW      │ CONTACTED   │ QUALIFIED   │   QUOTED    │    WON      │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │ ┌─────────┐ │
│ │John Doe │ │ │Sarah K. │ │ │Mike P.  │ │ │Team ABC │ │ │Jane D.  │ │
│ │EBC Trek │ │ │Annapurna│ │ │Paraglide│ │ │$4,800   │ │ │$2,400   │ │
│ │$2,000   │ │ │$3,500   │ │ │$500     │ │ │Dec 15   │ │ │Booked!  │ │
│ └─────────┘ │ └─────────┘ │ └─────────┘ │ └─────────┘ │ └─────────┘ │
│ ┌─────────┐ │             │ ┌─────────┐ │             │             │
│ │Bob S.   │ │             │ │Lisa R.  │ │             │             │
│ │Tour     │ │             │ │Trek     │ │             │             │
│ └─────────┘ │             │ └─────────┘ │             │             │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

**How to Use:**
- **Drag and Drop** - Move lead cards between columns as they progress
- **Click a Card** - Open lead details and activity history
- **Filter** - Use filters to show specific assignees, dates, or sources

#### Converting a Lead to Booking

When a lead is ready to book:

1. **Open the Lead** by clicking on it
2. **Click** `Convert to Booking`
3. **Verify Information**:
   - Tour/Service selection
   - Travel dates
   - Number of participants
   - Pricing
4. **Select Departure** (if applicable)
5. **Confirm Conversion**

The system will:
- ✅ Create a new booking record
- ✅ Move lead status to "Won"
- ✅ Reserve seats in inventory (if applicable)
- ✅ Send confirmation to customer (if enabled)

---

## 📅 Booking Engine

The Booking Engine handles all reservations for your travel services.

### Booking Lifecycle

Every booking goes through these stages:

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  DRAFT   │──▶│   HELD   │──▶│ PENDING  │──▶│CONFIRMED │──▶│COMPLETED │
│          │   │(Reserved)│   │ PAYMENT  │   │  (Paid)  │   │          │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
                    │              │
                    ▼              ▼
              ┌──────────┐   ┌──────────┐
              │ EXPIRED  │   │ CANCELLED│
              │(Hold ran │   │          │
              │   out)   │   │          │
              └──────────┘   └──────────┘
```

### Creating a Booking

#### Method 1: Direct Booking

1. **Navigate to** `Bookings → Create Booking`
2. **Select Resource** (Tour, Activity, Hotel)
3. **Choose Departure Date** (from available departures)
4. **Enter Guest Details**:
   - Primary guest name, email, phone
   - Number of participants
   - Additional participant details (if needed)
   - Special requirements (dietary, accessibility, etc.)
5. **Review Pricing**:
   - Base price × participants
   - Apply discount code (if any)
   - See taxes and total
6. **Select Payment Option**:
   - Full payment
   - Deposit (partial payment)
   - Send payment link
   - Record manual payment (cash/bank transfer)
   - Mark as OTA-collected
7. **Submit Booking**

#### Method 2: Convert from Lead (see CRM section)

#### Method 3: From Inventory Calendar (see Inventory section)

### Understanding Booking Sources

Track where bookings come from:

| Source | Description |
|--------|-------------|
| Website | Direct online booking |
| Phone | Customer called in |
| WhatsApp | Message inquiry converted |
| Email | Email inquiry converted |
| Walk-in | Customer came to office |
| OTA (Viator) | Online Travel Agency booking |
| OTA (GetYourGuide) | Online Travel Agency booking |
| Referral | Referred by existing customer |

### Managing Bookings

#### Booking List View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Bookings                                    [Filter ▼] [Search] [+ Create]  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Booking #      │ Guest        │ Tour          │ Date     │ Amount  │ Status│
├────────────────┼──────────────┼───────────────┼──────────┼─────────┼───────┤
│ TRK-2024-00142 │ Alice Smith  │ EBC Trek      │ Dec 15   │ $2,400  │ PAID  │
│ TRK-2024-00141 │ Bob Johnson  │ Annapurna     │ Dec 20   │ $3,200  │PENDING│
│ TRK-2024-00140 │ Team Corp    │ Paragliding   │ Dec 10   │ $800    │ PAID  │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Booking Actions

- **View Details** - Click booking to see full information
- **Edit** - Modify guest details, add notes
- **Send Reminder** - Email/SMS payment or departure reminder
- **Cancel** - Cancel with refund policy options
- **Download** - Export booking confirmation PDF

---

## 📦 Inventory Management

**The Heart of Travel Operations** - Inventory management controls what you sell and how many seats are available.

### Key Concept: Departures vs Tours

| Term | What It Means | Example |
|------|--------------|---------|
| **Tour/Resource** | A template/product you offer | "Everest Base Camp Trek" |
| **Departure** | A specific date when the tour runs | "EBC Trek on Dec 15, 2024" |
| **Seat/Slot** | Individual booking capacity | "40 seats available" |

> **Think of it this way:** A "Tour" is like a movie, and a "Departure" is like a specific showtime with limited seats.

### Inventory Dashboard

The Inventory Dashboard shows all your departures in a calendar view:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  December 2024                                            [< Today >]       │
├─────────────────────────────────────────────────────────────────────────────┤
│           Sun    Mon    Tue    Wed    Thu    Fri    Sat                     │
│                                                                              │
│  EBC Trek  ●15   ●28    ●35    ●40     -      -     ●8                      │
│  (40 cap)  OPEN  FEW    FULL  FULL          CLOSED  OPEN                    │
│            ████  ████   ████  ████                  ██                       │
│                                                                              │
│  Annapurna ●20    -     ●30    ●30   ●25     -     ●12                      │
│  (30 cap)  OPEN        FULL  FULL  WAIT          OPEN                       │
└─────────────────────────────────────────────────────────────────────────────┘

Legend: 
● Number = confirmed bookings
████ = capacity bar (filled = booked)
Status: OPEN | FEW_LEFT | FULL | WAITLIST | CLOSED
```

### Understanding Capacity

Each departure has multiple capacity numbers:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DEPARTURE: EBC Trek - Dec 15, 2024                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Total Capacity:     40 seats  (Maximum physical limit)                     │
│  Blocked:            -5 seats  (Reserved for staff/VIPs)                    │
│  Sellable Capacity:  35 seats  (What you can actually sell)                 │
│                                                                              │
│  ─────────────────────────────────────────────                              │
│  Confirmed:          28 seats  (Paid bookings)                              │
│  Held:                3 seats  (Temporary reservations)                     │
│  Available:           4 seats  (Can be booked NOW)                          │
│  ─────────────────────────────────────────────                              │
│                                                                              │
│  Overbooking Limit:   2 seats  (Allowed oversell buffer)                    │
│  Waitlist:            0 people (Waiting for cancellations)                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Departure Status Explained

| Status | Meaning | What Users See |
|--------|---------|----------------|
| **SCHEDULED** | Future tour, not yet open for booking | "Coming Soon" |
| **OPEN** | Available for booking | "Book Now" |
| **FEW_LEFT** | Less than 20% seats remaining | "Only 4 seats left!" |
| **FULL** | All seats booked | "Sold Out" |
| **WAITLIST** | Full but accepting waitlist | "Join Waitlist" |
| **CLOSED** | Booking cutoff passed | "Booking Closed" |
| **DEPARTED** | Tour has started/completed | - |

### Holds (Temporary Reservations)

When someone starts booking but hasn't paid:

- **Cart Hold**: 15 minutes - Customer added to cart
- **Payment Hold**: 30 minutes - Customer is on payment page
- **Admin Hold**: 24 hours - Staff is negotiating with customer

> ⚠️ **Important**: Holds automatically expire. Seats return to available pool if payment isn't completed.

### Creating a Departure

1. **Go to** `Inventory → Departures`
2. **Click** `+ Create Departure`
3. **Select Tour/Resource**
4. **Set Details**:
   - Departure date and time
   - Total capacity
   - Blocked seats (if any)
   - Pricing (can differ from base price)
   - Booking cutoff (how late can people book?)
   - Minimum participants (for guaranteed departure)
5. **Save Departure**

### Managing Departures

From the Departure Detail view, you can:

- **View all bookings** for that departure
- **See active holds** and extend/cancel them
- **Add manual booking** (walk-in or phone customer)
- **Block additional seats** (for groups or VIPs)
- **Close bookings** early (before cutoff)
- **Export guest manifest** (PDF/Excel)
- **Email all guests** (updates or reminders)

---

## 🎒 Resource Management

Resources are the products and services you offer.

### Types of Resources

| Type | Examples | Key Attributes |
|------|----------|----------------|
| **Tour/Trek** | EBC Trek, Annapurna Circuit | Duration, difficulty, itinerary |
| **Activity** | Paragliding, Rafting, Bungee | Duration, equipment needed |
| **Hotel** | Mountain Lodge, Base Camp | Room types, amenities |
| **Transportation** | Airport Transfer, Vehicle Rental | Vehicle type, capacity |

### Creating a Resource

1. **Navigate to** `Resources`
2. **Click** `Create Resource`
3. **Fill Details**:
   - **Name** - Display name (e.g., "Everest Base Camp Trek")
   - **Type** - Tour, Activity, Hotel, or Transportation
   - **Description** - What's included, highlights
   - **Duration** - Length of tour/service
   - **Base Price** - Default pricing
   - **Capacity** - Default seats per departure
   - **Images** - Upload photos
4. **Save Resource**

### Resource → Departure Flow

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│    RESOURCE     │────────▶│   DEPARTURES    │────────▶│    BOOKINGS     │
│   (Template)    │ Create  │  (Inventory)    │ Book    │ (Reservations)  │
│                 │ multiple│                 │ against │                 │
│ "EBC Trek"      │         │ Dec 15, Dec 22, │         │ Alice - Dec 15  │
│ 14 days         │         │ Jan 5, Jan 12   │         │ Bob - Dec 22    │
│ $2,400          │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

---

## 👤 HRMS - People Management

The HRMS module manages your entire workforce - from guides and drivers to office staff.

### HRMS Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HRMS MODULES                                    │
├─────────────────┬─────────────────┬─────────────────┬───────────────────────┤
│  PEOPLE CORE    │   WORK FLOW     │   MONEY FLOW    │    INSIGHTS           │
├─────────────────┼─────────────────┼─────────────────┼───────────────────────┤
│ • Employees     │ • Attendance    │ • Payroll       │ • HR Analytics        │
│ • Roles         │ • Leave         │ • Expenses      │ • Performance         │
│ • Documents     │ • Schedules     │ • Advances      │ • Cost Centers        │
│ • Skills        │ • Availability  │ • Incentives    │ • Reports             │
└─────────────────┴─────────────────┴─────────────────┴───────────────────────┘
```

### Employee Types

| Type | Description | Example |
|------|-------------|---------|
| **OFFICE** | Works from office, regular hours | Admin, Accountant |
| **FIELD** | Works on trips, variable schedule | Guide, Driver |
| **SEASONAL** | Part-time during peak seasons | Porter, Assistant Guide |
| **CONTRACT** | Fixed-term contract workers | Consultant, Specialist |

### Employee Categories

| Category | Role |
|----------|------|
| **GUIDE** | Lead or assistant trek/tour guides |
| **DRIVER** | Vehicle operators |
| **CREW** | Supporting trip staff |
| **COOK** | Kitchen staff for treks |
| **PORTER** | Load carriers |
| **ADMIN** | Office administration |
| **MANAGER** | Department/branch managers |
| **SUPPORT** | Other support roles |

### Module Deep-Dives

#### 1. Team Management (Employees)

**View Team Directory**
- See all employees with their status
- Filter by department, type, or status
- Quick actions: view profile, assign to trip

**Add New Employee**
1. Go to `HRMS → Employees → New Employee`
2. Fill personal details (name, contact, emergency contacts)
3. Set employment details:
   - Employee code (auto-generated or custom)
   - Type (Office/Field/Seasonal/Contract)
   - Category (Guide/Driver/Admin, etc.)
   - Department and branch
   - Reporting manager
   - Joining date
4. Configure compensation:
   - Pay model (Monthly/Daily/Per-Trip)
   - Salary components
5. Upload documents (ID, certifications)
6. Save employee

**Employee Lifecycle**
```
PRE_HIRE → ONBOARDING → ACTIVE → ON_LEAVE → NOTICE → RESIGNED/TERMINATED → ARCHIVED
```

#### 2. Attendance Management

**For Field Staff (Mobile App)**
1. Open app and tap "Check In"
2. GPS captures your location
3. Optional: Take a photo
4. Confirm check-in
5. At end of day/shift: Check Out

**For Managers (Dashboard)**
- View attendance summary for today
- See who's present, on trip, or absent
- Approve manual attendance corrections
- Generate attendance reports

**Attendance Types**
| Type | Meaning |
|------|---------|
| PRESENT | Regular work day |
| ON_TRIP | Working on a tour/trek |
| HALF_DAY | Worked half day |
| ABSENT | Did not report |
| REST_DAY | Scheduled off (between trips) |
| WEEK_OFF | Weekly day off |
| HOLIDAY | Company holiday |

#### 3. Leave Management

**Applying for Leave (Employee)**
1. Go to `HRMS → Leaves`
2. Click `Request Leave`
3. Select leave type (Casual, Sick, Paid, etc.)
4. Choose dates
5. System checks for conflicts:
   - ⚠️ If you're assigned to a trip during these dates
   - System suggests replacement options
6. Add reason and attachments (if required)
7. Submit request

**Approving Leave (Manager)**
1. Go to `HRMS → Leaves → Approvals`
2. See pending requests
3. Check impact (trip conflicts, team coverage)
4. Approve or Decline with comments

**Leave Balance Tracking**
- View your balance for each leave type
- See: Opening + Accrued - Taken = Available
- Carry-forward limits visible

#### 4. Staff Availability

**Check Who's Available**
1. Go to `HRMS → Availability`
2. Select date range
3. Filter by skills (e.g., "High Altitude Certified")
4. See availability calendar:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  December 2024 - Guide Availability                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  Name          │ 15-16 │ 17-18 │ 19-20 │ 21-22 │ 23-24 │ 25-26 │ 27-28    │
├────────────────┼───────┼───────┼───────┼───────┼───────┼───────┼──────────┤
│  Rajesh Kumar  │ TRIP  │ TRIP  │ TRIP  │ REST  │ FREE  │ FREE  │ TRIP     │
│  Amit Sharma   │ FREE  │ FREE  │ LEAVE │ LEAVE │ FREE  │ FREE  │ FREE     │
│  Priya Singh   │ TRIP  │ FREE  │ FREE  │ FREE  │ TRIP  │ TRIP  │ TRIP     │
└────────────────┴───────┴───────┴───────┴───────┴───────┴───────┴──────────┘
```

#### 5. Trip Assignments

**Assigning Staff to a Trip**
1. Go to trip/departure details
2. Click `Assign Staff`
3. System shows:
   - Required roles (Lead Guide, Driver, Cook, etc.)
   - Available staff matching skills
   - Conflict warnings
4. Select staff for each role
5. Staff receives notification to Accept/Decline
6. Once accepted, they're confirmed for the trip

**Trip Assignment Status**
```
PROPOSED → CONFIRMED → IN_PROGRESS → COMPLETED
              ↓
          DECLINED (with reason)
```

#### 6. Payroll

**Viewing Payslips (Employee)**
1. Go to `HRMS → Payroll`
2. Select month
3. View breakdown:
   - Basic salary
   - Allowances
   - Trip earnings (if field staff)
   - Deductions
   - Net payable
4. Download PDF payslip

**Running Payroll (HR)**
1. Go to `HRMS → Payroll → Run Payroll`
2. Select pay period (month)
3. System calculates:
   - Base salaries
   - Attendance-based adjustments
   - Trip bonuses/incentives
   - Leaves without pay
   - Statutory deductions
4. Review generated payslips
5. Make adjustments if needed
6. Approve and finalize
7. Export for bank transfer

#### 7. Expenses & Reimbursements

**Submitting Expense (Employee)**
1. Go to `HRMS → Expenses`
2. Click `New Expense Claim`
3. Add expense items:
   - Category (Travel, Meals, Equipment, etc.)
   - Amount
   - Date
   - Attach receipt/invoice
4. Link to trip (if applicable)
5. Submit for approval

**Approving Expenses (Manager)**
1. View pending expense claims
2. Verify receipts and amounts
3. Approve (full or partial) or Reject
4. Approved amounts go to next payroll

#### 8. Documents

**Uploading Documents**
- ID proofs (passport, driving license)
- Certifications (first aid, high altitude)
- Contracts and agreements
- Training certificates

All documents are:
- Securely stored
- Version controlled
- Expiry tracked (for certifications)
- Access controlled by role

#### 9. Approval Chains

Configure multi-level approvals for:
- Leave requests
- Expense claims
- Payroll
- Document submissions

Example chain:
```
Employee → Direct Manager → HR Manager → Finance (for expenses > ₹10,000)
```

#### 10. Cost Centers

Track labor costs by:
- Department
- Branch
- Trip/Project
- Activity type

Reports show:
- Cost per trip
- Cost per employee
- Monthly trends
- Budget vs actual

#### 11. Performance Management

**Tracking Employee Growth**
1. **Goals**: Set and track individual and team KPIs
2. **Reviews**: Conduct periodic performance evaluations
3. **Feedback**: Continuous 360-degree feedback loop
4. **Cycles**: Manage annual or quarterly review cycles

#### 12. HR Analytics

**Data-Driven People Decisions**
- **Headcount Trends**: Monitor team growth and turnover
- **Attendance Patterns**: Identify absenteeism or overtime trends
- **Cost Analysis**: Deep dive into labor costs and trip profitability
- **Skill Mapping**: Visualize team capabilities and training needs

---

## 🤝 Vendor & Supplier Management

Manage your ecosystem of partners, from transport providers to local hotels.

### Vendor Types Supported

| Type | Description |
|------|-------------|
| **TRANSPORT** | Vehicle owners (cars, jeeps, buses) |
| **HOTEL** | Hotels, homestays, and lodges |
| **EQUIPMENT** | Gear and equipment rental vendors |
| **GUIDE** | Local guides and specialized instructors |
| **CATERING** | Food and beverage service providers |

### Key Features

#### 1. Vendor Profiles (Single Source of Truth)
- **Identity**: Legal and display names, internal vendor codes
- **Financials**: Bank details, UPI IDs, and Tax information (GST/PAN)
- **Compliance**: Track licenses and certifications with expiry alerts
- **Performance**: Automated reliability scores and on-time rates

#### 2. Contracts & Rates
- Manage multi-year contracts with digital storage
- Define seasonal rates and special pricing tiers
- Track contract renewals and amendments

#### 3. Assignments & Payables
- **Assign Vendors**: Link vendors to specific bookings or trip departures
- **Track Payables**: Automatically generate payables based on assignments
- **Settlements**: Process payments and manage disputes in a unified view

---

## 💬 WhatsApp Operations

The WhatsApp Operations Layer turns WhatsApp into a powerful control surface for your business.

### Core Capabilities

#### 1. Automated Lead Capture
- New inquiries via WhatsApp automatically create leads in the CRM
- AI-driven context mapping links conversations to existing bookings

#### 2. Unified Timeline
- See every WhatsApp message, system notification, and payment update in a single, chronological timeline for every booking.

#### 3. Message Templates
- Send automated, pre-approved notifications for:
  - Booking confirmations
  - Payment reminders
  - Departure details
  - Feedback requests

#### 4. Staff Commands
- Field staff can perform actions via WhatsApp:
  - Check-in/Check-out for trips
  - Report issues or delays
  - Update trip status

---

## 🔐 User Roles & Permissions

### Standard Roles

| Role | Access Level |
|------|-------------|
| **Super Admin** | Full system access, all modules |
| **Admin** | Manage users, settings, all operational modules |
| **Manager** | Full access to CRM, Bookings, Inventory, Vendors |
| **Sales** | CRM (leads), view bookings, WhatsApp communication |
| **Operations** | Bookings, Inventory, HRMS (staff scheduling), Vendor assignments |
| **Finance** | Payroll, Vendor settlements, Expense approvals |
| **HR Manager** | Full HRMS access |
| **HR Executive** | HRMS (limited - no payroll approval) |
| **Employee** | Self-service (own attendance, leaves, payslips) |
| **Guide/Driver** | Mobile app & WhatsApp (check-in, trips, leaves) |

### Permission Areas

- **View** - Can see data
- **Create** - Can add new records
- **Edit** - Can modify existing records
- **Delete** - Can remove records
- **Approve** - Can approve workflows
- **Export** - Can download/export data

---

## 🔄 Common Workflows

### Workflow 1: Lead to Completion

```
1. LEAD CAPTURE
   └─► New lead enters system (website form, WhatsApp, manual entry)
   
2. QUALIFICATION
   └─► Sales rep contacts lead (Phone/WhatsApp)
   └─► Qualifies interest and budget
   
3. QUOTATION
   └─► Send detailed itinerary and pricing (Email/WhatsApp)
   └─► Negotiate if needed
   
4. CONVERSION
   └─► Lead accepts → Convert to Booking
   └─► System reserves seats in departure
   
5. PAYMENT
   └─► Customer pays (full or deposit)
   └─► Booking confirmed
   └─► Automated WhatsApp confirmation sent
   
6. PRE-DEPARTURE
   └─► Staff assigned to trip
   └─► Guest receives details (WhatsApp/Email)
   
7. DEPARTURE
   └─► Staff check in (Mobile App or WhatsApp)
   └─► Trip begins
   
8. COMPLETION
   └─► Trip ends
   └─► Feedback collected via WhatsApp
   └─► Staff attendance recorded
```

### Workflow 2: Monthly Payroll

```
1. ATTENDANCE COLLECTION (1st-5th of next month)
   └─► All attendance finalized
   └─► Manager approvals completed
   
2. EXPENSE PROCESSING
   └─► Pending expense claims approved/rejected
   
3. PAYROLL GENERATION (5th-7th)
   └─► System calculates all components
   └─► HR reviews calculations
   
4. REVIEW & ADJUSTMENT (7th-10th)
   └─► Handle exceptions
   └─► Make manual adjustments
   
5. APPROVAL (10th-12th)
   └─► HR Manager approves
   └─► Finance verifies
   
6. PAYMENT (15th)
   └─► Export bank file
   └─► Process salaries
   
7. DISTRIBUTION
   └─► Employees can view/download payslips
```

### Workflow 3: Staff Assignment for Trip

```
1. TRIP CREATED
   └─► Departure added to inventory
   
2. STAFFING REQUIREMENT
   └─► Operations defines roles needed
   └─► Lead Guide (1), Assistant (1), Driver (1), Cook (1)
   
3. AVAILABILITY CHECK
   └─► System shows available staff
   └─► Filters by skills, certifications
   
4. PROPOSAL
   └─► Ops manager selects staff
   └─► System checks for conflicts
   
5. NOTIFICATION
   └─► Staff receives assignment notification (App/WhatsApp)
   └─► Can Accept or Decline
   
6. CONFIRMATION
   └─► Once accepted, locked in
   └─► Calendar updated
   
7. TRIP DAY
   └─► Staff check in via mobile or WhatsApp
   └─► Attendance auto-tracked as "ON_TRIP"
   
8. COMPLETION
   └─► Trip ends
   └─► Performance feedback recorded
   └─► Trip earnings added to payroll
```

### Workflow 4: Vendor Assignment & Settlement

```
1. VENDOR ASSIGNMENT
   └─► Ops assigns Transport/Hotel vendor to a departure
   
2. RATE CONFIRMATION
   └─► System pulls rates from vendor contract
   └─► Manual adjustment if needed
   
3. SERVICE DELIVERY
   └─► Vendor provides service (e.g., vehicle for trip)
   
4. PAYABLE GENERATION
   └─► System generates payable record upon trip completion
   
5. VERIFICATION
   └─► Ops/Finance verifies service quality and final amount
   
6. SETTLEMENT
   └─► Finance processes payment to vendor
   └─► Status updated to "SETTLED"
```

---

## 💡 Tips & Best Practices

### For Sales Team

1. **Update leads daily** - Keep pipeline accurate for forecasting
2. **Use tags** - Tag leads by urgency, tour type, source
3. **Set reminders** - Never miss a follow-up
4. **Add notes** - Document all conversations
5. **Quick convert** - Don't let qualified leads wait

### For Operations

1. **Monitor inventory daily** - Watch for FEW_LEFT departures
2. **Clear expired holds** - Free up stuck inventory
3. **Plan staffing early** - Assign crew 2 weeks ahead
4. **Track sources** - Know where bookings come from
5. **Use manifests** - Export guest lists before departure

### For HR

1. **Complete onboarding** - Ensure all employee docs are uploaded
2. **Review attendance weekly** - Catch issues early
3. **Process leaves promptly** - Don't delay approvals
4. **Verify expense receipts** - Maintain audit trail
5. **Run payroll early** - Leave buffer for corrections

### For Field Staff

1. **Check in on time** - GPS timestamp is recorded
2. **Report offline if needed** - App works offline
3. **Request leaves early** - Gives time to find replacement
4. **Update availability** - Let ops know when you're free
5. **Download payslips** - Keep your records

---

## 📞 Need Help?

- **In-App Help**: Click the `?` icon for contextual help
- **Keyboard Shortcuts**: Press `?` to see available shortcuts
- **Contact Admin**: Reach your system administrator for access issues
- **Documentation**: Refer to this guide for detailed workflows

---

> **Version**: 1.0  
> **Last Updated**: December 2024  
> **Platform**: Travel Management System (TMS)

---

*Built with ❤️ for Travel Businesses*
