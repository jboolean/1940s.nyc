import React, { useEffect } from 'react';

import classnames from 'classnames';

import { useHistory, useParams } from 'react-router';
import {
  ReactZoomPanPinchContentRef,
  ReactZoomPanPinchProps,
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
  'click',
] as const;

const INITIAL_SCALE = 1.05;

export default function ViewerPane({
  className,
}: {
  className: string;
}): JSX.Element {
  const { identifier: photoIdentifier } = useParams<{ identifier?: string }>();
  const history = useHistory();

  const overlayRef = React.useRef<HTMLDivElement>(null);
  const zoomHitAreaRef = React.useRef<HTMLDivElement>(null);
  const zoomHitAreaEl = zoomHitAreaRef.current;
  const wrapperRef = React.useRef<ReactZoomPanPinchContentRef>(null);
  const wrapperComponent = wrapperRef.current?.instance?.wrapperComponent;
  const [isZoomed, setIsZoomed] = React.useState(false);

  // This is just to trigger a re-render so the effect is re-run
  const setIsHitAreaRefSet = React.useState(false)[1];

  // The overlay is on top and normally would capture all events, but we also need the zooming wrapper to see these events
  // This hook forwards events from the overlay to the wrapper
  useEventForwarding(
    zoomHitAreaEl,
    wrapperComponent,
    ZOOM_PAN_PINCH_EVENT_TYPES
  );

  // Reset the transform when the photo changes
  useEffect(() => {
    if (wrapperRef.current) wrapperRef.current.resetTransform();
  }, [photoIdentifier, wrapperRef]);

  const handleZoom: ReactZoomPanPinchProps['onTransformed'] = (
    _ref,
    state
  ): void => {
    const scale = state.scale;

    setIsZoomed(scale > INITIAL_SCALE);
  };

  // Simulate a double click upon a single click
  useEffect(() => {
    const toggleZoom = (e: PointerEvent): void => {
      if (e.target !== e.currentTarget) return;
      // If not a mouse, ignore
      if (e.pointerType !== 'mouse') return;
      // If not a single click, ignore
      if (e.detail !== 1) return;
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      if (isZoomed) wrapper.resetTransform();
      else {
        wrapper.instance.onDoubleClick(e);
      }
    };

    if (wrapperComponent) {
      wrapperComponent.addEventListener('click', toggleZoom);
      return () => {
        wrapperComponent.removeEventListener('click', toggleZoom);
      };
    }
  }, [wrapperComponent, isZoomed]);

  return (
    <TransformWrapper
      ref={wrapperRef}
      initialScale={INITIAL_SCALE}
      centerOnInit={true}
      initialPositionY={-50}
      initialPositionX={-10}
      onTransformed={handleZoom}
      doubleClick={{
        mode: isZoomed ? 'reset' : 'zoomIn',
        step: 1.5,
      }}
      panning={{
        excluded: [stylesheet.overlayContentWrapper],
      }}
    >
      <div className={classnames(stylesheet.container, className)}>
        <Overlay className={stylesheet.overlay} overlayRef={overlayRef}>
          <div className={classnames(stylesheet.overlayContentWrapper)}>
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

            <div
              key="zoomhitarea"
              ref={(el) => {
                zoomHitAreaRef.current = el;
                setIsHitAreaRefSet(!!el);
              }}
              className={classnames(
                stylesheet.zoomHitArea,
                stylesheet.zoomable,
                {
                  [stylesheet.zoomed]: isZoomed,
                }
              )}
            ></div>

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
          wrapperClass={classnames(
            stylesheet.transformWrapper,
            stylesheet.zoomable,
            {
              [stylesheet.zoomed]: isZoomed,
            }
          )}
          contentClass={stylesheet.transformContent}
        >
          <ImageSwitcher
            view={ImageStack.makeImageSwitcherView({
              photoIdentifier,
              className: stylesheet.imageStack,
              imgProps: {
                alt: 'Historic photo of this location',
              },
              isFullResVisible: isZoomed,
            })}
          />
        </TransformComponent>
      </div>
    </TransformWrapper>
  );
}
