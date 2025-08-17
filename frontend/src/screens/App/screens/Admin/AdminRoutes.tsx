import React from 'react';

import { Route, Switch, useRouteMatch } from 'react-router-dom';
import LoginPage from './screens/LoginPage';
import ReviewMerch from './screens/ReviewMerch';
import ReviewStories from './screens/ReviewStories';
import PrivateRoute from './shared/components/PrivateRoute';

export default function AdminRoutes(): JSX.Element {
  const { path } = useRouteMatch();

  return (
    <Switch>
      <Route path={`${path}/login`} component={LoginPage} />
      <PrivateRoute path={`${path}/review-stories`} component={ReviewStories} />
      <PrivateRoute path={`${path}/review-merch`} component={ReviewMerch} />
    </Switch>
  );
}
