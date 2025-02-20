import React from 'react';

import { activateGoogleOptimize } from 'utils/optimize';

import { useWindowSize } from '@react-hook/window-size';
import noop from 'lodash/noop';
import { ColorThemeContext } from '../ColorThemeContext';

import classnames from 'classnames';
import ReactModal from 'react-modal';
import stylesheet from './modal.less';

const MODAL_WIDTH_MAX = 800; // @modal-width-max
const MODAL_HEIGHT_MAX = 600; // @modal-height-max

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
  const [width, height] = useWindowSize();
  const isFullWidthModal =
    width <= MODAL_WIDTH_MAX || height <= MODAL_HEIGHT_MAX;
  const theme = isFullWidthModal ? 'light' : 'dark';
  return (
    <ColorThemeContext.Provider value={theme}>
      <ReactModal
        className={classnames(
          stylesheet.modal,
          stylesheet[size],
          stylesheet['color-theme-' + theme],
          {
            [stylesheet.fullWidth]: isFullWidthModal,
          },
          className
        )}
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
              aria-label="Close dialog"
            />
          </>
        )}
        {children}
      </ReactModal>
    </ColorThemeContext.Provider>
  );
}
