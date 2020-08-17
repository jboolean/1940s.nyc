import React from 'react';

import {
  Route,
  Switch,
  Redirect,
  BrowserRouter as Router,
} from 'react-router-dom';

import ViewerPane from './screens/ViewerPane';
import MapPane from './screens/MapPane';
import Welcome from './screens/Welcome';
import Shutdown from './screens/Shutdown';

import stylesheet from './App.less';
import Outtakes from './screens/ImageGrid';

const IS_SHUTDOWN = false;

export default function App(): JSX.Element {
  const [isWelcomeOpen, setWelcomeOpen] = React.useState(true);

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
