import React from 'react';

import { Route, Switch, Redirect, Router } from 'react-router-dom';
import history from 'utils/history';
import ViewerPane from './screens/ViewerPane';
import MapPane from './screens/MapPane';
import Welcome from './screens/Welcome';
import Shutdown from './screens/Shutdown';
import ThankYou from './screens/MapPane/components/TipJar/ThankYou';
import BestOfBoroughBanner from './screens/BestOfBoroughBanner';

import stylesheet from './App.less';
import Outtakes from './screens/ImageGrid';

import 'utils/optimize';

const IS_SHUTDOWN = false;

const thankYouInitial = window.location.search.includes('tipSuccess');
const noWelcome = window.location.search.includes('noWelcome');

if (thankYouInitial || noWelcome)
  history.replace(
    `${window.location.protocol}//${window.location.host}${window.location.pathname}${window.location.hash}`
  );

export default function App(): JSX.Element {
  const [isThankYouOpen, setThankYouOpen] = React.useState(thankYouInitial);
  const [isWelcomeOpen, setWelcomeOpen] = React.useState(
    !isThankYouOpen && !noWelcome
  );

  return (
    <div className={stylesheet.outermostContainer}>
      <BestOfBoroughBanner />
      <Router history={history}>
        <div className={stylesheet.mainContentWrapper}>
          <div className={stylesheet.mainContentContainer}>
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

            <Route path="/*/photo/:identifier">
              <ViewerPane className={stylesheet.viewer} />
            </Route>
            <Switch>
              {!IS_SHUTDOWN && (
                <Route
                  path={['/map/photo/:identifier', '/map']}
                  render={() => <MapPane className={stylesheet.mapContainer} />}
                />
              )}
              <Route path={['/outtakes/photo/:identifier', '/outtakes']}>
                <Outtakes className={stylesheet.outtakesContainer} />
              </Route>
              {!IS_SHUTDOWN && <Redirect to="/map" />}
            </Switch>
          </div>
        </div>
      </Router>
    </div>
  );
}
