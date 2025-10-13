import React from 'react';

import {
  Navigate,
  Outlet,
  Route,
  Routes,
  matchPath,
  unstable_HistoryRouter as HistoryRouter,
  useLocation,
} from 'react-router-dom';
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

import useLoginStore from 'shared/stores/LoginStore';
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
  const location = useLocation();

  React.useEffect(() => {
    if (openTipJarOnLoad) {
      openTipJar();
    }
  }, [openTipJar]);

  const isMapOrStories =
    location.pathname.startsWith('/map') ||
    location.pathname.startsWith('/stories');

  return (
    <>
      {isMapOrStories ? (
        IS_SHUTDOWN ? (
          <Shutdown isOpen={true} />
        ) : (
          <Welcome
            isOpen={isWelcomeOpen}
            onRequestClose={() => {
              setWelcomeOpen(false);
            }}
          />
        )
      ) : null}

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
}: {
  children?: React.ReactNode;
}): JSX.Element {
  return (
    <div className={stylesheet.outermostContainer}>
      <AnnouncementBanner />
      <Modals />
      <div className={stylesheet.mainContentWrapper}>{children}</div>
    </div>
  );
}

function ContextWrappers({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const initialize = useLoginStore((state) => state.initialize);

  React.useEffect(() => {
    initialize();
  }, [initialize]);

  return <OptimizeExperimentsProvider>{children}</OptimizeExperimentsProvider>;
}

function MainContentRoutes(): JSX.Element {
  const location = useLocation();

  const viewerMatch =
    matchPath('/:section/photo/:identifier', location.pathname) ||
    null;

  return (
    <MainContentLayout>
      <div className={stylesheet.mainContentContainer}>
        {viewerMatch ? <ViewerPane className={stylesheet.viewer} /> : null}
        <Outlet />
      </div>
    </MainContentLayout>
  );
}

export default function App(): JSX.Element {
  return (
    <ContextWrappers>
      <HistoryRouter history={history}>
        <Routes>
          <Route element={<MainContentRoutes />}>
            <Route path="map">
              <Route
                index
                element={<MapPane className={stylesheet.mapContainer} />}
              />
              <Route
                path="photo/:identifier"
                element={<MapPane className={stylesheet.mapContainer} />}
              />
            </Route>
            <Route path="outtakes">
              <Route
                index
                element={<Outtakes className={stylesheet.outtakesContainer} />}
              />
              <Route
                path="photo/:identifier"
                element={<Outtakes className={stylesheet.outtakesContainer} />}
              />
            </Route>
            <Route path="stories">
              <Route
                index
                element={<AllStories className={stylesheet.outtakesContainer} />}
              />
              <Route
                path="photo/:identifier"
                element={<AllStories className={stylesheet.outtakesContainer} />}
              />
              <Route path="edit" element={<EditStory />} />
            </Route>
          </Route>
          <Route path="orders" element={<Orders />} />
          <Route path="labs" element={<FeatureFlags />} />
          <Route path="admin/*" element={<AdminRoutes />} />
          <Route path="render-merch/tote-bag" element={<ToteBag />} />
          <Route path="*" element={<Navigate to="/map" replace />} />
        </Routes>
      </HistoryRouter>
    </ContextWrappers>
  );
}
