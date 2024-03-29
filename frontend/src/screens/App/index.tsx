import React from 'react';

import { Redirect, Route, Router, Switch } from 'react-router-dom';
import history from 'utils/history';
import AnnouncementBanner from './screens/AnnouncementBanner';
import MapPane from './screens/MapPane';
import Shutdown from './screens/Shutdown';
import ThankYou from './screens/TipJar/ThankYou';
import ViewerPane from './screens/ViewerPane';
import Welcome from './screens/Welcome';

import stylesheet from './App.less';
import AllStories from './screens/AllStories';
import Outtakes from './screens/Outtakes';

import { OptimizeExperimentsProvider } from 'shared/utils/OptimizeExperiments';
import 'utils/optimize';
import AdminRoutes from './screens/Admin/AdminRoutes';
import CreditPurchaseModal, {
  CreditPurchaseSuccessMessage,
} from './screens/CreditPurchaseModal';
import EditStory from './screens/EditStory';
import FeatureFlags from './screens/FeatureFlags';
import SubmitStoryWizard from './screens/SubmitStoryWizard';
import TipJar, { useTipJarStore } from './screens/TipJar';
import Corrections from './screens/Corrections';

const IS_SHUTDOWN = false;

const searchParams = new URLSearchParams(window.location.search);

const thankYouInitial = searchParams.has('tipSuccess');
const creditSuccessInitial = searchParams.has('creditPurchaseSuccess');
const openTipJarOnLoad = searchParams.has('openTipJar');
const noWelcome = searchParams.has('noWelcome');

if (noWelcome) searchParams.delete('noWelcome');
history.replace({
  pathname: history.location.pathname,
  hash: history.location.hash,
  search: searchParams.toString(),
});

function Modals(): JSX.Element {
  const [isThankYouOpen, setThankYouOpen] = React.useState(thankYouInitial);
  const [isCreditPurchaseSuccessOpen, setCreditPurchaseSuccessOpen] =
    React.useState(creditSuccessInitial);
  const [isWelcomeOpen, setWelcomeOpen] = React.useState(
    !isThankYouOpen && !openTipJarOnLoad && !noWelcome
  );

  const openTipJar = useTipJarStore((state) => state.open);

  React.useEffect(() => {
    if (openTipJarOnLoad) {
      openTipJar();
    }
  }, [openTipJar]);

  return (
    <>
      <Route path={['/map', '/stories']}>
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
      </Route>

      <ThankYou
        isOpen={isThankYouOpen}
        onRequestClose={() => {
          setThankYouOpen(false);
        }}
      />
      <SubmitStoryWizard />
      <Corrections />
      <CreditPurchaseModal />
      <CreditPurchaseSuccessMessage
        isOpen={isCreditPurchaseSuccessOpen}
        onRequestClose={() => {
          setCreditPurchaseSuccessOpen(false);
        }}
      />
      <TipJar />
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
                <Route path="/stories/edit">
                  <EditStory />
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
