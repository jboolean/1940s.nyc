import React from 'react';

import { Redirect, Route, RouteProps } from 'react-router-dom';

import useAuthStore from 'shared/stores/AuthStore';

export default function PrivateRoute({
  children,
  component,
  ...rest
}: RouteProps): JSX.Element {
  const ProtectedComponent = (): JSX.Element => {
    const isAuthenticated = useAuthStore((state) => state.isAutheticated);

    if (isAuthenticated) {
      return component ? React.createElement(component) : <>{children}</>;
    } else {
      return <Redirect to="/admin/login" />;
    }
  };

  return <Route {...rest} component={ProtectedComponent} render={null}></Route>;
}
