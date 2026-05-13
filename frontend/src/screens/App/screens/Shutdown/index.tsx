import React from 'react';

import noop from 'lodash/noop';
import Modal from 'react-modal';

import stylesheet from './shutdown.less';

interface Props {
  isOpen: boolean;
}
export default function Shutdown({ isOpen }: Props): JSX.Element {
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
      <h1 data-testid="welcome-heading">
        Street View of 1940s&nbsp;New&nbsp;York
      </h1>
      <h2>Project Archived</h2>
      <p>
        Thank you for everyone who enjoyed this project. I do not have the time
        to continue to maintain it.
      </p>
      <p>
        Tips and unused credits since February 2026 are eligible for refund.
        Please email <a href="mailto:julian@1940s.nyc">julian@1940s.nyc</a>.
      </p>
      <hr />
    </Modal>
  );
}
