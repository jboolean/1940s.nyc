import React from 'react';

import { activateGoogleOptimize } from 'utils/optimize';

import noop from 'lodash/noop';

import ReactModal from 'react-modal';
import classnames from 'classnames';
import stylesheet from './modal.less';

export type FourtiesModalProps = React.PropsWithChildren<ReactModal.Props> & {
  size: 'large' | 'small' | 'x-large';
  isCloseButtonVisible?: boolean;
};

export default function FourtiesModal({
  className,
  size,
  overlayClassName,
  bodyOpenClassName,
  isCloseButtonVisible = true,
  onAfterOpen = noop,
  children,
  ...props
}: FourtiesModalProps): JSX.Element {
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
      {isCloseButtonVisible && (
        <>
          <button
            type="button"
            className={stylesheet.closeButton}
            onClick={props.onRequestClose}
            title="Close"
          />
        </>
      )}
      {children}
    </ReactModal>
  );
}
