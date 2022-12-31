import React from 'react';

import { Redirect, Route, RouteProps, useLocation } from 'react-router-dom';

import useAuthStore from 'shared/stores/AuthStore';

export default function PrivateRoute({
  children,
  component,
  ...rest
}: RouteProps): JSX.Element {
  const ProtectedComponent = (): JSX.Element => {
    const isAuthenticated = useAuthStore((state) => state.isAutheticated);
    const location = useLocation();

    if (isAuthenticated) {
      return component ? React.createElement(component) : <>{children}</>;
    } else {
      return (
        <Redirect
          to={{
            pathname: '/admin/login',
            state: { from: location },
          }}
        />
      );
    }
  };

  return <Route {...rest} component={ProtectedComponent} render={null}></Route>;
}
