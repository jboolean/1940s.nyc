import ReactDOM from 'react-dom';
import React from 'react';
import Modal from 'react-modal';
import netlifyIdentity from 'netlify-identity-widget';

import 'normalize.css';
import 'core-js/stable';
import 'utils/initMapboxgl';
// import 'modernizr';

import App from './screens/App';

import './app.less';

const containerEl = document.getElementById('app-container');

window.netlifyIdentity = netlifyIdentity;
netlifyIdentity.init({});

Modal.setAppElement(containerEl);

ReactDOM.render(React.createElement(App), containerEl);
