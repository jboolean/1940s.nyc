import React from 'react';

import { Route, Routes } from 'react-router-dom';
import LoginPage from './screens/LoginPage';
import ReviewMerch from './screens/ReviewMerch';
import ReviewStories from './screens/ReviewStories';
import PrivateRoute from './shared/components/PrivateRoute';

export default function AdminRoutes(): JSX.Element {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<PrivateRoute />}>
        <Route path="review-stories" element={<ReviewStories />} />
        <Route path="review-merch" element={<ReviewMerch />} />
      </Route>
    </Routes>
  );
}
