import ReactDOM from 'react-dom';
import React from 'react';

import 'normalize.css';
import 'core-js/stable';
import 'utils/initMapboxgl';

import Map from './screens/Map';

ReactDOM.render(
  React.createElement(Map),
  document.getElementById('app-container')
);
