import ReactDOM from 'react-dom';
import React from 'react';

import 'normalize.css';
import 'core-js/stable';
import 'utils/initMapboxgl';

import MainMap from './screens/MainMap';

ReactDOM.render(
  React.createElement(MainMap),
  document.getElementById('app-container')
);
