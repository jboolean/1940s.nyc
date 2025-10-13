import React, { useEffect } from 'react';

import classnames from 'classnames';

import {
  InnerTransformedContent,
  ReactZoomPanPinchContentRef,
  ReactZoomPanPinchProps,
  TransformComponent,
  TransformWrapper,
} from '@jboolean/react-zoom-pan-pinch';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Alternates from './components/Alternates';
import ImageButtons from './components/ImageButtons';
import * as ImageStack from './components/ImageStack';
import ImageSwitcher from './components/ImageSwitcher';
import Overlay from './components/Overlay';
import Stories from './components/Stories';

import stylesheet from './ViewerPane.less';
import useCanHover from './shared/utils/useCanHover';

const INITIAL_SCALE = 1.05;

const ClickToZoomHitArea = ({
  wrapper,
  isZoomed,
  isPanning,
}: {
  wrapper: ReactZoomPanPinchContentRef;
  isZoomed: boolean;
  isPanning: boolean;
}): JSX.Element | null => {
  const canHover = useCanHover();

  const startXRef = React.useRef<number>(0);
  const startYRef = React.useRef<number>(0);

  const handleZoomHitAreaMouseDown = (
    e: React.MouseEvent<HTMLDivElement>
  ): void => {
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
  };

  const handleZoomHitAreaClick = (
    e: React.MouseEvent<HTMLDivElement>
  ): void => {
    if (!wrapper) return;
    const { clientX, clientY } = e;

    const deltaX = clientX - startXRef.current;
    const deltaY = clientY - startYRef.current;
    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
    // If the pointer moved more than 10 pixels, ignore
    if (distance > 10) {
      return;
    }

    if (isZoomed) wrapper.resetTransform();
    else wrapper.zoomToPoint(clientX, clientY, 3.8, 200, 'easeOut');
  };

  if (!canHover) {
    return null;
  }

  return (
    <div
      onMouseDown={handleZoomHitAreaMouseDown}
      onClick={handleZoomHitAreaClick}
      className={classnames(stylesheet.zoomHitArea, stylesheet.zoomable, {
        [stylesheet.zoomed]: isZoomed,
        [stylesheet.panning]: isPanning,
      })}
    ></div>
  );
};

export default function ViewerPane({
  className,
}: {
  className: string;
}): JSX.Element {
  const { identifier: photoIdentifier } = useParams<{ identifier?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const overlayRef = React.useRef<HTMLDivElement>(null);
  const wrapperRef = React.useRef<ReactZoomPanPinchContentRef>(null);
  const [isZoomed, setIsZoomed] = React.useState(false);
  const [isPanning, setIsPanning] = React.useState(false);
  const canHover = useCanHover();

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

  return (
    <TransformWrapper
      ref={wrapperRef}
      initialScale={INITIAL_SCALE}
      centerOnInit={true}
      initialPositionY={-50}
      initialPositionX={-20}
      onTransformed={handleZoom}
      wheel={{
        excluded: [stylesheet.panPinchExcluded],
      }}
      doubleClick={{
        // If you have a mouse, use single clicks implemented on the hit target
        disabled: canHover,
        mode: isZoomed ? 'reset' : 'zoomIn',
        step: 1.5,
        excluded: [stylesheet.panPinchExcluded],
      }}
      panning={{
        excluded: [stylesheet.panPinchExcluded],
      }}
      onPanningStart={() => setIsPanning(true)}
      onPanningStop={() => setIsPanning(false)}
    >
      <div className={classnames(stylesheet.container, className)}>
        <TransformComponent
          wrapperClass={classnames(stylesheet.transformWrapper, {
            [stylesheet.zoomable]: canHover,
            [stylesheet.zoomed]: isZoomed,
            [stylesheet.panning]: isPanning,
          })}
          // This is a custom option from our forked version of react-zoom-pan-pinch
          childrenIncludesContentWrapper={true}
        >
          <Overlay className={stylesheet.overlay} overlayRef={overlayRef}>
            <div className={classnames(stylesheet.overlayContentWrapper)}>
              <div className={stylesheet.floorFade} />

              <button
                className={stylesheet.closeButton}
                onClick={() => {
                  const closePath = location.pathname.replace(
                    /\/photo\/[^/]+$/,
                    ''
                  );
                  navigate(
                    {
                      pathname: closePath || '/',
                      hash: location.hash,
                    },
                    { replace: false }
                  );
                }}
              >
                Close
              </button>

              <div
                className={classnames(
                  stylesheet.alternates,
                  stylesheet.panPinchExcluded
                )}
              >
                <Alternates originalIdentifier={photoIdentifier} />
              </div>

              <ClickToZoomHitArea
                wrapper={wrapperRef.current}
                isZoomed={isZoomed}
                isPanning={isPanning}
              />

              <div
                className={classnames(
                  stylesheet.stories,
                  stylesheet.panPinchExcluded
                )}
              >
                <Stories photoIdentifier={photoIdentifier} />
              </div>

              <div
                className={classnames(
                  stylesheet.buttons,
                  stylesheet.panPinchExcluded
                )}
              >
                <ImageButtons />
              </div>

              <p className={stylesheet.credit}>
                Photo courtesy NYC Municipal Archives{' '}
              </p>
            </div>
          </Overlay>

          <InnerTransformedContent className={stylesheet.transformContent}>
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
          </InnerTransformedContent>
        </TransformComponent>
      </div>
    </TransformWrapper>
  );
}
