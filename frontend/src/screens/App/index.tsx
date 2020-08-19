import React from 'react';

import {
  Route,
  Switch,
  Redirect,
  BrowserRouter as Router,
} from 'react-router-dom';

import queryString from 'query-string';

import ViewerPane from './screens/ViewerPane';
import MapPane from './screens/MapPane';
import Welcome from './screens/Welcome';
import Shutdown from './screens/Shutdown';
import ThankYou from './screens/MapPane/components/TipJar/ThankYou';

import stylesheet from './App.less';
import Outtakes from './screens/ImageGrid';

const IS_SHUTDOWN = false;

const query = queryString.parse(window.location.search);

export default function App(): JSX.Element {
  const [isThankYouOpen, setThankYouOpen] = React.useState(
    'tipSuccess' in query
  );
  const [isWelcomeOpen, setWelcomeOpen] = React.useState(!isThankYouOpen);

  return (
    <Router>
      <div className={stylesheet.container}>
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
    </Router>
  );
}
