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
                </Route>
            </Route>
        </Routes>
    );
}

export default App;
