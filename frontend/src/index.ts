import ReactDOM from 'react-dom';
import React from 'react';

import 'normalize.css';
import 'core-js/stable';
import 'utils/initMapboxgl';

import App from './screens/App';

import './app.less';

ReactDOM.render(
  React.createElement(App),
  document.getElementById('app-container')
);
