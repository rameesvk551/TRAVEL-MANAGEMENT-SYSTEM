import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute, PublicRoute } from '@/components/common';
import Dashboard from '@/pages/Dashboard';
import Resources from '@/pages/Resources';
import CreateResource from '@/pages/CreateResource';
import EditResource from '@/pages/EditResource';
import Bookings from '@/pages/Bookings';
import CreateBooking from '@/pages/CreateBooking';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import { PipelineBoard } from '@/pages/crm/PipelineBoard';
import { LeadDetail } from '@/pages/crm/LeadDetail';
import { LeadForm } from '@/pages/crm/LeadForm';
import { Leads } from '@/pages/crm/Leads';
import DashboardList from '@/pages/dashboards/DashboardList';
import DashboardBuilder from '@/pages/dashboards/DashboardBuilder';
import InventoryDashboard from '@/pages/inventory/InventoryDashboard';
import DepartureDetail from '@/pages/inventory/DepartureDetail';
import {
    VendorDashboard,
    VendorList,
    VendorDetail,
    VendorForm,
    PayablesList,
    SettlementsList,
    AssignmentsList,
} from '@/pages/vendor';
import {
    GearDashboard,
    GearItemsList,
    GearCategoriesList,
} from '@/pages/gear';
import {
    HrmsDashboard,
    EmployeesPage,
    NewEmployeePage,
    AttendancePage,
    LeavesPage,
    PayrollPage,
    TeamDashboardPage,
    DocumentsPage,
    AvailabilityPage,
    ExpensesPage,
    SchedulePage,
    // Enterprise Phase 3
    ApprovalChainsPage,
    PerformancePage,
    HRAnalyticsPage,
    CostCentersPage,
    PayrollExportPage,
} from '@/pages/hrms';

function App() {
    return (
        <Routes>
            {/* Public routes */}
            <Route element={<PublicRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
            </Route>

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
                <Route path="/" element={<MainLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="resources" element={<Resources />} />
                    <Route path="resources/new" element={<CreateResource />} />
                    <Route path="resources/:id/edit" element={<EditResource />} />
                    <Route path="bookings" element={<Bookings />} />
                    <Route path="bookings/new" element={<CreateBooking />} />
                    <Route path="leads" element={<Leads />} />
                    <Route path="crm" element={<PipelineBoard />} />
                    <Route path="crm/leads/new" element={<LeadForm />} />
                    <Route path="crm/leads/:id" element={<LeadDetail />} />

                    {/* Inventory Management Routes */}
                    <Route path="inventory" element={<InventoryDashboard />} />
                    <Route path="inventory/departures/:id" element={<DepartureDetail />} />

                    {/* Dashboard Builder Routes */}
                    <Route path="dashboards" element={<DashboardList />} />
                    <Route path="dashboards/builder" element={<DashboardBuilder />} />

                    {/* HRMS Routes */}
                    <Route path="hrms" element={<HrmsDashboard />} />
                    <Route path="hrms/employees" element={<EmployeesPage />} />
                    <Route path="hrms/employees/new" element={<NewEmployeePage />} />
                    <Route path="hrms/attendance" element={<AttendancePage />} />
                    <Route path="hrms/attendance/check-in" element={<AttendancePage />} />
                    <Route path="hrms/leaves" element={<LeavesPage />} />
                    <Route path="hrms/leaves/apply" element={<LeavesPage />} />
                    <Route path="hrms/documents" element={<DocumentsPage />} />
                    <Route path="hrms/payroll" element={<PayrollPage />} />
                    <Route path="hrms/payroll/latest" element={<PayrollPage />} />
                    <Route path="hrms/team" element={<TeamDashboardPage />} />
                    <Route path="hrms/availability" element={<AvailabilityPage />} />
                    <Route path="hrms/expenses" element={<ExpensesPage />} />
                    <Route path="hrms/schedule" element={<SchedulePage />} />
                    
                    {/* Enterprise Phase 3 - HRMS */}
                    <Route path="hrms/approvals" element={<ApprovalChainsPage />} />
                    <Route path="hrms/performance" element={<PerformancePage />} />
                    <Route path="hrms/analytics" element={<HRAnalyticsPage />} />
                    <Route path="hrms/cost-centers" element={<CostCentersPage />} />
                    <Route path="hrms/payroll-export" element={<PayrollExportPage />} />

                    {/* Vendor Management Routes */}
                    <Route path="vendors" element={<VendorDashboard />} />
                    <Route path="vendors/list" element={<VendorList />} />
                    <Route path="vendors/new" element={<VendorForm />} />
                    <Route path="vendors/:id" element={<VendorDetail />} />
                    <Route path="vendors/:id/edit" element={<VendorForm />} />
                    <Route path="vendors/payables" element={<PayablesList />} />
                    <Route path="vendors/settlements" element={<SettlementsList />} />
                    <Route path="vendors/settlements/new" element={<SettlementsList />} />
                    <Route path="vendors/assignments" element={<AssignmentsList />} />

                    {/* Gear Management Routes */}
                    <Route path="gear" element={<GearDashboard />} />
                    <Route path="gear/items" element={<GearItemsList />} />
                    <Route path="gear/categories" element={<GearCategoriesList />} />
                </Route>
            </Route>
        </Routes>
    );
}

export default App;
