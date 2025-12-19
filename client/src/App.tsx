import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute, PublicRoute } from '@/components/common';
import Dashboard from '@/pages/Dashboard';
import Resources from '@/pages/Resources';
import CreateResource from '@/pages/CreateResource';
import EditResource from '@/pages/EditResource';
import Login from '@/pages/Login';
import Register from '@/pages/Register';

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
                </Route>
            </Route>
        </Routes>
    );
}

export default App;
