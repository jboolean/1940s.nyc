import ReactDOM from 'react-dom';
import React from 'react';
import Modal from 'react-modal';

import 'normalize.css';
import 'core-js/stable';
import 'utils/initMapboxgl';

import App from './screens/App';

import './app.less';

const containerEl = document.getElementById('app-container');

Modal.setAppElement(containerEl);

ReactDOM.render(React.createElement(App), containerEl);
