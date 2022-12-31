import React from 'react';

import { Route, Switch, useRouteMatch } from 'react-router-dom';
import ReviewStories from './screens/ReviewStories';

export default function AdminRoutes(): JSX.Element {
  const { path } = useRouteMatch();

  return (
    <Switch>
      <Route path={`${path}/review-stories`} component={ReviewStories} />
    </Switch>
  );
}
