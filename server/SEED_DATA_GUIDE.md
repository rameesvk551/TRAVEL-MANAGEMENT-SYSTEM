# Database Seeding Guide

This document explains how to populate your Travel Management System database with rich, realistic dummy data for development and testing.

## 🚀 Quick Start

Run all seed scripts in the correct order:

```bash
cd server
npm run seed:all
```

This will populate the database with comprehensive data across all modules.

## 📊 Individual Seed Scripts

You can also run individual seed scripts:

### 1. Core Data
```bash
npm run seed
```
**Creates:**
- 1 Tenant (demo-travel)
- 2 Users (admin & staff)
- 35 Resources (Treks, Tours, Vehicles, Hotels, Activities)
- 50 Contacts with location data
- 60 Leads with realistic scoring and stages
- 110+ Activities (Calls, Emails, Meetings, Tasks, Notes)
- 150 Bookings with calculated pricing
- 200+ Payments with realistic status

**Details:**
- Resources include detailed descriptions and realistic pricing
- Leads distributed across pipeline stages with budgets
- Bookings spread over 12 months with GST calculations
- Payment status: 70% completed, 20% pending, 10% cancelled

### 2. HRMS Data
```bash
npm run seed:hrms
```
**Creates:**
- 3 Branches (Delhi HQ, Mumbai Office, Manali Base)
- 6 Departments (Operations, Sales, Guides, Logistics, Finance, HR)
- 30+ Employees (Office Staff, Field Staff, Seasonal Workers)
- 8 Skills (Trekking, First Aid, Driving, Languages, etc.)
- 5 Leave Types (CL, SL, EL, LWP, CO)
- Leave Balances for current year
- 15+ Leave Requests (mix of approved, pending, rejected)
- 30 days of Attendance records per employee
- Pay Structures (Monthly, Per-Trip, Daily rates)
- 3 months of Payroll records
- 40+ Trip Assignments
- 50+ Expense Claims

**Details:**
- Employees have realistic salaries and compensation structures
- Attendance includes office check-ins and trip assignments
- Payroll calculations include basic salary, allowances, and deductions
- Field staff have trip-based or daily rate compensation

### 3. Inventory Data
```bash
npm run seed:inventory
```
**Creates:**
- 100+ Departure Instances across all resources
- Realistic availability calculations
- 40 Inventory Holds (cart items, payment pending, approvals)
- Pricing tiers (Early Bird, Standard, Last Minute)

**Details:**
- Departures spread over next 8-12 weeks
- Status varies: SCHEDULED, OPEN, FEW_LEFT, FULL, DEPARTED
- Hold types with appropriate TTL (30 min for cart, 24h for payment)
- Real-time seat availability calculations

### 4. WhatsApp Data
```bash
npm run seed:whatsapp
```
**Creates:**
- 6 Message Templates (Booking, Payment, Welcome, Trip Reminder, Feedback, Offers)
- 30 Conversations (Active, Pending, Closed)
- 250+ Messages (realistic conversation flow)
- 5 Campaigns (Completed, Active, Scheduled, Draft)

**Details:**
- Templates follow WhatsApp Business API format
- Messages show realistic inquiry-to-booking conversations
- Campaign stats include sent, delivered, read, replied metrics
- Message status tracking: SENT, DELIVERED, READ

### 5. Vendor Data
```bash
npm run seed:vendors
```
**Creates:**
- 30 Vendors across different categories
- 40 Contracts with realistic terms
- 80 Service Records with quality ratings
- 100 Vendor Payments with status tracking

**Details:**
- Vendor types: Hotels, Transport, Food, Equipment, Activities, Guides, Services
- Payment terms: NET_30, NET_15, NET_7, ADVANCE, IMMEDIATE
- Contract values range from ₹50,000 to ₹5,00,000
- Service quality ratings (1-5 stars)
- Payment status includes overdue tracking

## 🔐 Default Login Credentials

After seeding, use these credentials:

**Admin User:**
- Email: `admin@demo.com`
- Password: `password123`
- Role: Administrator

**Staff User:**
- Email: `staff@demo.com`
- Password: `password123`
- Role: Staff

**Tenant:** `demo-travel`

## 📈 Data Statistics

| Module | Records | Details |
|--------|---------|---------|
| **Resources** | 35 | Treks (10), Tours (10), Vehicles (8), Hotels (5), Activities (2) |
| **Contacts** | 50 | Distributed across India and international locations |
| **Leads** | 60 | Across all pipeline stages with realistic scoring |
| **Activities** | 110+ | Mix of completed, pending, and cancelled |
| **Bookings** | 150 | Spread over 12 months with realistic revenue |
| **Payments** | 200+ | Advance, balance, token payments tracked |
| **Employees** | 30+ | Office staff, field staff, seasonal workers |
| **Attendance** | 900+ | 30 days × 30 employees |
| **Payroll** | 90 | 3 months × 30 employees |
| **Departures** | 100+ | Real-time availability tracking |
| **WhatsApp Messages** | 250+ | Realistic conversations |
| **Vendors** | 30 | Comprehensive vendor ecosystem |
| **Vendor Payments** | 100 | Payment tracking with due dates |

## 💰 Financial Data Realism

### Booking Revenue
- Base amounts: ₹15,000 - ₹1,00,000
- GST: 18% calculated accurately
- Discounts: 0%, 10%, or 15%
- Total bookings value: ~₹1.5 Crore

### Employee Costs
- Salaries: ₹26,000 - ₹50,000/month for full-time
- Trip rates: ₹1,800 - ₹3,000/trip for contractors
- Daily rates: ₹950 - ₹1,300/day for seasonal
- Total monthly payroll: ~₹12 Lakhs

### Vendor Payments
- Contract values: ₹50,000 - ₹5,00,000
- Service charges: ₹5,000 - ₹50,000 per transaction
- Total vendor spend: ~₹2 Crore annually

## 🎯 Use Cases

This seed data supports testing of:

### Dashboard & Analytics
- Revenue trends over 12 months
- Booking conversion rates by source
- Employee productivity metrics
- Inventory utilization rates
- Payment collection efficiency

### CRM & Sales
- Lead pipeline visualization
- Activity tracking and follow-ups
- Contact management
- Sales forecasting
- Source attribution

### Operations
- Resource allocation
- Departure management
- Inventory holds and releases
- Employee trip assignments
- Vendor service tracking

### Finance
- Payment reconciliation
- Outstanding receivables
- Vendor payment scheduling
- Payroll processing
- Tax calculations (GST)

### HRMS
- Attendance management
- Leave management
- Payroll processing
- Performance tracking
- Expense reimbursement

### WhatsApp Integration
- Automated messaging
- Campaign management
- Conversation tracking
- Template testing
- Analytics and reporting

## 🔄 Resetting Data

To clear and reseed the database:

```bash
# Clear all data (cascading deletes from tenants)
npm run migrate

# Run all seeds again
npm run seed:all
```

## 📝 Customization

Each seed script can be customized by editing the respective file in `src/scripts/`:

- `seed.ts` - Core business data
- `seed_hrms.ts` - HRMS module
- `seed_inventory.ts` - Inventory management
- `seed_whatsapp.ts` - WhatsApp integration
- `seed_vendors.ts` - Vendor management

## 🐛 Troubleshooting

**Error: Tenant not found**
- Run `npm run seed` first to create the base tenant

**Error: Foreign key violation**
- Seeds must run in order: Core → HRMS → Inventory → WhatsApp → Vendors
- Use `npm run seed:all` for automatic ordering

**Error: Duplicate key**
- Clear existing data first with `npm run migrate`
- Or manually delete from specific tables

## 📚 Additional Resources

- See `FEATURES.md` for feature documentation
- See `USER_GUIDE.md` for user instructions
- See `docs/` folder for architecture details

---

**Last Updated:** December 2024
**Version:** 1.0.0
