import React from 'react';

import { Navigate, useLocation } from 'react-router';

import useAuthStore from 'shared/stores/AuthStore';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export default function PrivateRoute({
  children,
}: PrivateRouteProps): JSX.Element {
  const isAuthenticated = useAuthStore((state) => state.isAutheticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
    );
  }

  return <>{children}</>;
}
