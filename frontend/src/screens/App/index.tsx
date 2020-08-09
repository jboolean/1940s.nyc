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

import stylesheet from './App.less';
import Outtakes from './screens/ImageGrid';

export default function App(): JSX.Element {
  const [isWelcomeOpen, setWelcomeOpen] = React.useState(true);

  return (
    <Router>
      <div className={stylesheet.container}>
        <Welcome
          isOpen={isWelcomeOpen}
          onRequestClose={() => {
            setWelcomeOpen(false);
          }}
        />
        <Route path="/*/photo/:identifier">
          <ViewerPane />
        </Route>
        <Switch>
          <Route
            path={['/map/photo/:identifier', '/map']}
            render={() => <MapPane className={stylesheet.mapContainer} />}
          />
          <Route path={['/outtakes/photo/:identifier', '/outtakes']}>
            <Outtakes className={stylesheet.outtakesContainer} />
          </Route>
          <Redirect to="/map" />
        </Switch>
      </div>
    </Router>
  );
}
