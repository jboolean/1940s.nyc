import React from 'react';

import Modal from 'react-modal';
import noop from 'lodash/noop';
import Mailchimp from './Mailchimp';

import stylesheet from './shutdown.less';

interface Props {
  isOpen: boolean;
}
export default function ({ isOpen }: Props): JSX.Element {
  return (
    <Modal
      isOpen={isOpen}
      className={stylesheet.shutdownModal}
      bodyOpenClassName={stylesheet.bodyOpen}
      overlayClassName={stylesheet.overlay}
      onRequestClose={noop}
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEsc={false}
    >
      <h1>Street View of 1940s&nbsp;New&nbsp;York</h1>
      <h2>Well that was fun…and expensive</h2>
      <p>
        Thank you to everyone who shared my project of mapping photos of 1940s
        New York! Unfortunately, the costs for the map service I was using got
        out of control. I plan to re-launch the site after I find a more
        affordable mapping solution.
      </p>
      <p>
        Please leave your email address so I can let you know when the site is
        back up.
      </p>
      <p>
        I promise it{' '}
        <a
          href="https://www.timeout.com/newyork/news/find-out-what-your-nyc-building-looked-like-in-the-1940s-081420"
          target="_blank"
          rel="noopener noreferrer"
        >
          was
        </a>{' '}
        <a
          href="http://boingboing.net/2020/08/14/explore-nyc-in-the-1930s-and-1.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          cool
        </a>{' '}
        and will be back.
      </p>

      <Mailchimp />
      <hr />
      <p className={stylesheet.finePrint}>
        by{' '}
        <a
          href="http://julianboilen.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Julian Boilen
        </a>
      </p>
    </Modal>
  );
}
