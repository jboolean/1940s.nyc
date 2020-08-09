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

interface State {
  isWelcomeOpen: boolean;
}

export default class App extends React.PureComponent<{}, State> {
  constructor(props: {}) {
    super(props);
    this.state = {
      isWelcomeOpen: true,
    };
  }

  render(): React.ReactNode {
    const { isWelcomeOpen } = this.state;

    return (
      <Router>
        <div className={stylesheet.container}>
          <Welcome
            isOpen={isWelcomeOpen}
            onRequestClose={() => {
              this.setState({ isWelcomeOpen: false });
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
            <Redirect to="/map" />
          </Switch>
        </div>
      </Router>
    );
  }
}
