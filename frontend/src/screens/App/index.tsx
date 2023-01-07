import React from 'react';

import { Redirect, Route, Router, Switch } from 'react-router-dom';
import history from 'utils/history';
import AnnouncementBanner from './screens/AnnouncementBanner';
import MapPane from './screens/MapPane';
import ThankYou from './screens/MapPane/components/TipJar/ThankYou';
import Shutdown from './screens/Shutdown';
import ViewerPane from './screens/ViewerPane';
import Welcome from './screens/Welcome';

import stylesheet from './App.less';
import Outtakes from './screens/ImageGrid';
import AllStories from './screens/AllStories';

import { OptimizeExperimentsProvider } from 'shared/utils/OptimizeExperiments';
import 'utils/optimize';
import AdminRoutes from './screens/Admin/AdminRoutes';
import FeatureFlags from './screens/FeatureFlags';
import SubmitStoryWizard from './screens/SubmitStoryWizard';

const IS_SHUTDOWN = false;

const thankYouInitial = window.location.search.includes('tipSuccess');
const noWelcome = window.location.search.includes('noWelcome');

if (noWelcome)
  history.replace({
    pathname: history.location.pathname,
    hash: history.location.hash,
  });

function Modals(): JSX.Element {
  const [isThankYouOpen, setThankYouOpen] = React.useState(thankYouInitial);
  const [isWelcomeOpen, setWelcomeOpen] = React.useState(
    !isThankYouOpen && !noWelcome
  );

  return (
    <>
      {IS_SHUTDOWN ? (
        <Shutdown isOpen={true} />
      ) : (
        <Welcome
          isOpen={isWelcomeOpen}
          onRequestClose={() => {
            setWelcomeOpen(false);
          }}
        />
      )}

      <ThankYou
        isOpen={isThankYouOpen}
        onRequestClose={() => {
          setThankYouOpen(false);
        }}
      />
      <SubmitStoryWizard />
    </>
  );
}

export default function App(): JSX.Element {
  return (
    <OptimizeExperimentsProvider>
      <div className={stylesheet.outermostContainer}>
        <AnnouncementBanner />
        <Router history={history}>
          <div className={stylesheet.mainContentWrapper}>
            <div className={stylesheet.mainContentContainer}>
              <Modals />

              <Route path="/*/photo/:identifier">
                <ViewerPane className={stylesheet.viewer} />
              </Route>
              <Switch>
                {!IS_SHUTDOWN && (
                  <Route
                    path={['/map/photo/:identifier', '/map']}
                    render={() => (
                      <MapPane className={stylesheet.mapContainer} />
                    )}
                  />
                )}
                <Route path={['/outtakes/photo/:identifier', '/outtakes']}>
                  <Outtakes className={stylesheet.outtakesContainer} />
                </Route>
                <Route path={['/stories/photo/:identifier', '/stories']}>
                  <AllStories className={stylesheet.outtakesContainer} />
                </Route>
                <Route path="/labs">
                  <FeatureFlags />
                </Route>
                <Route path="/admin">
                  <AdminRoutes />
                </Route>
                {!IS_SHUTDOWN && <Redirect to="/map" />}
              </Switch>
            </div>
          </div>
        </Router>
      </div>
    </OptimizeExperimentsProvider>
  );
}
