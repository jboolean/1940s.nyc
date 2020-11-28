import React from 'react';

import { activateGoogleOptimize } from 'utils/optimize';

import noop from 'lodash/noop';

import ReactModal from 'react-modal';
import classnames from 'classnames';
import stylesheet from './modal.less';

export default function FourtiesModal({
  className,
  size,
  overlayClassName,
  bodyOpenClassName,
  isCloseButtonVisible = true,
  onAfterOpen = noop,
  children,
  ...props
}: React.PropsWithChildren<ReactModal.Props> & {
  size: 'large' | 'small';
  isCloseButtonVisible?: boolean;
}): JSX.Element {
  return (
    <ReactModal
      className={classnames(stylesheet.modal, stylesheet[size], className)}
      bodyOpenClassName={classnames(stylesheet.bodyOpen, bodyOpenClassName)}
      overlayClassName={classnames(stylesheet.overlay, overlayClassName)}
      onAfterOpen={() => {
        activateGoogleOptimize();
        onAfterOpen();
      }}
      {...props}
    >
      <>
        <button
          type="button"
          className={stylesheet.closeButton}
          onClick={props.onRequestClose}
          title="Close"
        />
        {children}
      </>
    </ReactModal>
  );
}
