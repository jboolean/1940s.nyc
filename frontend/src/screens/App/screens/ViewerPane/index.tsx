import React from 'react';

import classnames from 'classnames';

import { useHistory, useParams } from 'react-router';
import {
  ReactZoomPanPinchContentRef,
  TransformComponent,
  TransformWrapper,
} from 'react-zoom-pan-pinch';
import Alternates from './components/Alternates';
import ImageButtons from './components/ImageButtons';
import * as ImageStack from './components/ImageStack';
import ImageSwitcher from './components/ImageSwitcher';
import Overlay from './components/Overlay';
import Stories from './components/Stories';

import stylesheet from './ViewerPane.less';
import useEventForwarding from './shared:utils/useEventForwarding';

// react-zoom-pan-pinch relies on these events
// We need to forward them from the overlay to the wrapper
const ZOOM_PAN_PINCH_EVENT_TYPES = [
  'wheel',
  'dblclick',
  'touchstart',
  'touchend',
  'touchmove',
  'pointerover',
  'pointerleave',
  'pointerdown',
  'mousedown',
  'mouseup',
  'mousemove',
  'mouseleave',
  'mouseenter',
  'keyup',
  'keydown',
] as const;

export default function ViewerPane({
  className,
}: {
  className: string;
}): JSX.Element {
  const { identifier: photoIdentifier } = useParams<{ identifier?: string }>();
  const history = useHistory();

  const overlayRef = React.useRef<HTMLDivElement>(null);
  const wrapperRef = React.useRef<ReactZoomPanPinchContentRef>(null);
  const wrapperComponent = wrapperRef.current?.instance?.wrapperComponent;

  // The overlay is on top and normally would capture all events, but we also need the zooming wrapper to see these events
  // This hook forwards events from the overlay to the wrapper
  useEventForwarding(
    overlayRef.current,
    wrapperComponent,
    ZOOM_PAN_PINCH_EVENT_TYPES
  );

  return (
    <TransformWrapper ref={wrapperRef}>
      <div className={classnames(stylesheet.container, className)}>
        <Overlay className={stylesheet.overlay} overlayRef={overlayRef}>
          <div className={stylesheet.overlayContentWrapper}>
            <div className={stylesheet.floorFade} />

            <button
              className={stylesheet.closeButton}
              onClick={() =>
                history.push({ pathname: '..', hash: window.location.hash })
              }
            >
              Close
            </button>

            <div className={stylesheet.alternates}>
              <Alternates originalIdentifier={photoIdentifier} />
            </div>

            <div className={stylesheet.stories}>
              <Stories photoIdentifier={photoIdentifier} />
            </div>

            <div className={stylesheet.buttons}>
              <ImageButtons />
            </div>

            <p className={stylesheet.credit}>
              Photo courtesy NYC Municipal Archives{' '}
            </p>
          </div>
        </Overlay>
        <TransformComponent
          wrapperClass={stylesheet.transformWrapper}
          contentClass={stylesheet.transformContent}
        >
          <ImageSwitcher
            view={ImageStack.makeImageSwitcherView({
              photoIdentifier,
              className: stylesheet.imageStack,
              imgProps: {
                alt: 'Historic photo of this location',
              },
            })}
          />{' '}
        </TransformComponent>
      </div>
    </TransformWrapper>
  );
}
