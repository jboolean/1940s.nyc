import React from 'react';

import { Redirect, Route, Router, Switch } from 'react-router-dom';
import history from 'utils/history';
import AnnouncementBanner from './screens/AnnouncementBanner';
import MapPane from './screens/MapPane';
import Shutdown from './screens/Shutdown';
import ThankYou from './screens/TipJar/ThankYou';
import ToteBag from './screens/ToteBag';
import ViewerPane from './screens/ViewerPane';
import Welcome from './screens/Welcome';

import stylesheet from './App.less';
import AllStories from './screens/AllStories';
import Outtakes from './screens/Outtakes';

import { OptimizeExperimentsProvider } from 'shared/utils/OptimizeExperiments';
import 'utils/optimize';
import AdminRoutes from './screens/Admin/AdminRoutes';
import Corrections from './screens/Corrections';
import CreditPurchaseModal, {
  CreditPurchaseSuccessMessage,
} from './screens/CreditPurchaseModal';
import EditStory from './screens/EditStory';
import FeatureFlags from './screens/FeatureFlags';
import Orders from './screens/Merch/screens/Orders';
import SubmitStoryWizard from './screens/SubmitStoryWizard';
import TipJar, { useTipJarStore } from './screens/TipJar';

const IS_SHUTDOWN = false;

const searchParams = new URLSearchParams(window.location.search);

const thankYouInitial = searchParams.has('tipSuccess');
const creditSuccessInitial = searchParams.has('creditPurchaseSuccess');
const openTipJarOnLoad = searchParams.has('openTipJar');
const noWelcome = searchParams.has('noWelcome');
const noTipJar = searchParams.has('noTipJar');

if (noWelcome) searchParams.delete('noWelcome');
if (noTipJar) searchParams.delete('noTipJar');
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
      {noTipJar ? null : <TipJar />}
    </>
  );
}

function MainContentLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className={stylesheet.outermostContainer}>
      <AnnouncementBanner />
      <Modals />
      <div className={stylesheet.mainContentWrapper}>
        <div className={stylesheet.mainContentContainer}>{children}</div>
      </div>
    </div>
  );
}

export default function App(): JSX.Element {
  return (
    <OptimizeExperimentsProvider>
      <Router history={history}>
        <Switch>
          {/* Routes with main layout (image viewer, announcements, modals) */}
          <Route path={['/map', '/outtakes', '/stories']}>
            <MainContentLayout>
              <Route path="/*/photo/:identifier">
                <ViewerPane className={stylesheet.viewer} />
              </Route>
              <Switch>
                <Route
                  path={['/map/photo/:identifier', '/map']}
                  render={() => <MapPane className={stylesheet.mapContainer} />}
                />
                <Route path={['/outtakes/photo/:identifier', '/outtakes']}>
                  <Outtakes className={stylesheet.outtakesContainer} />
                </Route>
                <Route path="/stories/edit">
                  <EditStory />
                </Route>
                <Route path={['/stories/photo/:identifier', '/stories']}>
                  <AllStories className={stylesheet.outtakesContainer} />
                </Route>
              </Switch>
            </MainContentLayout>
          </Route>
          <Route>
            {/* Routes without main layout */}
            <Switch>
              <Route path="/orders">
                <Orders />
              </Route>
              <Route path="/labs">
                <FeatureFlags />
              </Route>
              <Route path="/admin">
                <AdminRoutes />
              </Route>
              <Route path="/render-merch/tote-bag">
                <ToteBag />
              </Route>
              <Redirect to="/map" />
            </Switch>
          </Route>
        </Switch>
      </Router>
    </OptimizeExperimentsProvider>
  );
}
