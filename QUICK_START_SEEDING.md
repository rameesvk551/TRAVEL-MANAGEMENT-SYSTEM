# 🚀 Quick Start: Populate Your Database with Rich Data

## Step 1: Navigate to Server Directory
```powershell
cd C:\Users\ACER\www\TravelManagementSystem\server
```

## Step 2: Run the Master Seed Script
```powershell
npm run seed:all
```

This will automatically populate ALL modules in the correct order:
1. ✅ Core Data (Resources, Leads, Contacts, Activities, Bookings, Payments)
2. ✅ HRMS (Employees, Attendance, Payroll, Leaves, Trip Assignments, Expenses)
3. ✅ Inventory (Departures, Holds, Availability)
4. ✅ WhatsApp (Conversations, Messages, Templates, Campaigns)
5. ✅ Vendors (Vendors, Contracts, Services, Payments)

## Expected Output

You should see progress messages like:
```
============================================================
🌱 STARTING COMPLETE DATABASE SEEDING
============================================================

============================================================
🚀 STEP 1/5: Core Data (Resources, Leads, Bookings, Payments)
============================================================

🌱 Starting expanded seed...
Cleaning up old data...
Creating Tenant...
Creating Users...
Creating 35 Resources...
Creating 50 Contacts...
Creating 60 Leads...
Creating 110+ Activities...
Creating 150 Bookings with Payments...
✅ Expanded seed completed successfully

✅ STEP 1/5: Core Data - COMPLETED

[... continues through all 5 steps ...]

============================================================
✅ ALL SEEDING COMPLETED SUCCESSFULLY!
============================================================

📊 DATABASE SUMMARY:
  • 35 Resources (Treks, Tours, Vehicles, Hotels, Activities)
  • 50 Contacts across different locations
  • 60 Leads with realistic scoring and stages
  • 110+ Activities (Calls, Emails, Meetings, Tasks)
  • 150 Bookings with calculated taxes and payments
  • 30+ Employees with full HRMS records
  • 100+ Departure instances with real-time availability
  • 40 Inventory holds (Cart, Payment Pending)
  • 30+ WhatsApp conversations with 250+ messages
  • 6 Message templates and 5 campaigns
  • 30 Vendors with contracts and service records
  • 100 Vendor payments tracked

🔐 LOGIN CREDENTIALS:
  Admin: admin@demo.com / password123
  Staff: staff@demo.com / password123
  Tenant: demo-travel
```

## Alternative: Run Individual Seeds

If you need to run specific modules only:

```powershell
# Core data only
npm run seed

# HRMS only (requires core data first)
npm run seed:hrms

# Inventory only (requires core data first)
npm run seed:inventory

# WhatsApp only (requires core data first)
npm run seed:whatsapp

# Vendors only
npm run seed:vendors
```

## What Gets Created

### 📊 Summary Statistics
- **Total Records:** 2,000+
- **Booking Revenue:** ~₹1.5 Crore
- **Monthly Payroll:** ~₹12 Lakhs
- **Vendor Spend:** ~₹2 Crore annually

### 💼 Core Business
- 35 Resources with detailed descriptions
- 50 Contacts from various locations
- 60 Leads across pipeline stages
- 110+ Activities tracking customer interactions
- 150 Bookings with proper calculations
- 200+ Payments (advance, balance, token)

### 👥 HRMS Module
- 30+ Employees (office, field, seasonal)
- 900+ Attendance records
- 90 Payroll records (3 months)
- 40+ Trip assignments
- 50+ Expense claims

### 📦 Inventory
- 100+ Departures with pricing tiers
- Real-time availability tracking
- 40 Holds (cart, payment pending)
- Automatic status management

### 💬 WhatsApp
- 6 Professional templates
- 30 Active conversations
- 250+ Messages (realistic flow)
- 5 Marketing campaigns

### 🏢 Vendors
- 30 Vendors (hotels, transport, equipment, etc.)
- 40 Contracts with terms
- 80 Service records
- 100 Payment transactions

## 🎯 Financial Calculations

All financial data includes realistic calculations:

### Bookings
```
Base: ₹50,000
Discount (10%): -₹5,000
After Discount: ₹45,000
GST (18%): +₹8,100
Total: ₹53,100
```

### Payments
- Advance (30%): ₹15,930
- Balance (70%): ₹37,170

### Payroll
```
Basic: ₹45,000
Deductions (PF): -₹4,500
Net: ₹40,500
```

## ✅ Verify Success

After seeding, check these in your application:

1. **Dashboard:** Should show revenue trends over 12 months
2. **Leads:** 60 leads distributed across pipeline stages
3. **Bookings:** 150 bookings with payment status
4. **HRMS:** 30+ employees with attendance and payroll
5. **Inventory:** 100+ departures with availability
6. **WhatsApp:** 30 conversations with messages
7. **Vendors:** 30 vendors with contracts

## 🔄 Reset & Reseed

To start fresh:

```powershell
# This will clear all data
npm run migrate

# Then reseed
npm run seed:all
```

## 🆘 Troubleshooting

**Error: Cannot connect to database**
- Check your `.env` file has correct DB credentials
- Ensure PostgreSQL is running

**Error: Tenant not found**
- Run `npm run seed` first to create base tenant

**Error: Module not found**
- Make sure you're in the server directory
- Run `npm install` if needed

## 📚 Documentation

- `SEED_DATA_GUIDE.md` - Detailed documentation
- `SEED_DATA_SUMMARY.md` - Implementation summary
- `FEATURES.md` - Feature list
- `USER_GUIDE.md` - User manual

## 🎉 Next Steps

1. ✅ Run `npm run seed:all`
2. ✅ Start your server: `npm run dev`
3. ✅ Start your client: `cd ../client && npm run dev`
4. ✅ Login with: `admin@demo.com` / `password123`
5. ✅ Explore all modules with rich data!

**Your application is now fully populated with realistic, calculation-rich data! 🚀**
