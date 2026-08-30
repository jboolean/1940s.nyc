import React from 'react';

import { datadogRum } from '@datadog/browser-rum';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useMatch,
} from 'react-router';
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
  openCreditPurchaseModal,
} from './screens/CreditPurchaseModal';
import EditStory from './screens/EditStory';
import FeatureFlags from './screens/FeatureFlags';
import Orders from './screens/Merch/screens/Orders';
import MerchModal, { openMerchModal } from './screens/MerchModal';
import NewsletterModal from './screens/NewsletterModal';
import SubmitStoryWizard from './screens/SubmitStoryWizard';
import TipJar, { useTipJarStore } from './screens/TipJar';

const IS_SHUTDOWN = true;

const searchParams = new URLSearchParams(window.location.search);

const thankYouInitial = searchParams.has('tipSuccess');
const creditSuccessInitial = searchParams.has('creditPurchaseSuccess');
const openTipJarOnLoad = searchParams.has('openTipJar');
const openMerchOnLoad = searchParams.has('openMerch');
const noWelcome = searchParams.has('noWelcome');
const noTipJar = searchParams.has('noTipJar') || IS_SHUTDOWN;
const openCreditPurchaseOnLoad = searchParams.has('openCreditPurchase');

if (noWelcome) searchParams.delete('noWelcome');
if (noTipJar) searchParams.delete('noTipJar');
if (openMerchOnLoad) searchParams.delete('openMerch');
if (openCreditPurchaseOnLoad) searchParams.delete('openCreditPurchase');
const currentUrl = new URL(window.location.href);
currentUrl.search = searchParams.toString();
window.history.replaceState(
  null,
  '',
  currentUrl.pathname +
    (currentUrl.search ? currentUrl.search : '') +
    currentUrl.hash
);

function DatadogRouteTracker(): null {
  const location = useLocation();
  React.useEffect(() => {
    datadogRum.startView({
      name: location.pathname + location.search + location.hash,
    });
  }, [location.pathname, location.search, location.hash]);
  return null;
}

function Modals(): JSX.Element {
  const [isThankYouOpen, setThankYouOpen] = React.useState(thankYouInitial);
  const [isCreditPurchaseSuccessOpen, setCreditPurchaseSuccessOpen] =
    React.useState(creditSuccessInitial);
  const [isWelcomeOpen, setWelcomeOpen] = React.useState(
    !isThankYouOpen &&
      !openTipJarOnLoad &&
      !openMerchOnLoad &&
      !noWelcome &&
      !openCreditPurchaseOnLoad
  );

  const onMap = useMatch('/map/*');
  const onStories = useMatch('/stories/*');
  const onMapOrStories = onMap !== null || onStories !== null;

  const openTipJar = useTipJarStore((state) => state.open);

  React.useEffect(() => {
    if (openTipJarOnLoad) {
      openTipJar();
    }
  }, [openTipJar]);

  React.useEffect(() => {
    if (openMerchOnLoad) {
      openMerchModal();
    }
  }, []);

  React.useEffect(() => {
    if (openCreditPurchaseOnLoad) {
      openCreditPurchaseModal();
    }
  }, []);

  return (
    <>
      {onMapOrStories &&
        (IS_SHUTDOWN ? (
          <Shutdown isOpen={true} />
        ) : (
          <Welcome
            isOpen={isWelcomeOpen}
            onRequestClose={() => {
              setWelcomeOpen(false);
            }}
          />
        ))}

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
      <MerchModal />
      <NewsletterModal />
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

export default function App(): JSX.Element {
  return (
    <ContextWrappers>
      <BrowserRouter>
        <DatadogRouteTracker />
        <Routes>
          {/* Routes with main layout (image viewer, announcements, modals) */}
          <Route
            path="/map/*"
            element={
              <MainContentLayout>
                <Routes>
                  <Route
                    path="photo/:identifier"
                    element={<ViewerPane className={stylesheet.viewer} />}
                  />
                </Routes>
                <MapPane className={stylesheet.mapContainer} />
              </MainContentLayout>
            }
          />
          <Route
            path="/outtakes/*"
            element={
              <MainContentLayout>
                <Routes>
                  <Route
                    path="photo/:identifier"
                    element={<ViewerPane className={stylesheet.viewer} />}
                  />
                </Routes>
                <Outtakes className={stylesheet.outtakesContainer} />
              </MainContentLayout>
            }
          />
          <Route
            path="/stories/*"
            element={
              <MainContentLayout>
                <Routes>
                  <Route
                    path="photo/:identifier"
                    element={<ViewerPane className={stylesheet.viewer} />}
                  />
                </Routes>
                <Routes>
                  <Route path="edit" element={<EditStory />} />
                  <Route
                    path="*"
                    element={
                      <AllStories className={stylesheet.outtakesContainer} />
                    }
                  />
                </Routes>
              </MainContentLayout>
            }
          />
          {/* Routes without main layout */}
          <Route path="/orders" element={<Orders />} />
          <Route path="/labs" element={<FeatureFlags />} />
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="/render-merch/tote-bag" element={<ToteBag />} />
          <Route path="*" element={<Navigate to="/map" />} />
        </Routes>
      </BrowserRouter>
    </ContextWrappers>
  );
}
