import type { ReactNode } from 'react';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const allowedRoles = new Set(['super_admin', 'platform_admin', 'owner']);

export const AdminRoleGuard = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  if (!allowedRoles.has(user.role.toLowerCase())) {
    return (
      <Result
        status="403"
        title="Super Admin Access Required"
        subTitle="This module is isolated for platform administration and is not available to tenant roles."
        extra={<Button onClick={() => navigate('/')}>Back to Tenant Dashboard</Button>}
      />
    );
  }

  return <>{children}</>;
};
