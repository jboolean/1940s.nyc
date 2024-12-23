import React, { RefObject } from 'react';

import classnames from 'classnames';
import { CSSTransition } from 'react-transition-group';

import { useFeatureFlag } from 'screens/App/shared/stores/FeatureFlagsStore';
import FeatureFlag from 'screens/App/shared/types/FeatureFlag';
import useCanHover from '../../shared/utils/useCanHover';
import stylesheet from './Overlay.less';

// Encapsulates overlay logic for fading children in and out
export default function Overlay({
  className,
  overlayRef,
  children,
}: React.PropsWithChildren<{
  className?: string;
  overlayRef?: RefObject<HTMLDivElement>;
}>): JSX.Element {
  // This feature flag is useful in development to prevent the overlay from disappearing
  const alwaysShowOverlay = useFeatureFlag(FeatureFlag.ALWAYS_SHOW_OVERLAY);

  // Okay so, my Android phone is reporting hover events of type "mouse"
  // This will let us ignore those events on devices that cannot hover
  const canHover = useCanHover();

  const startXRef = React.useRef<number>(0);
  const startYRef = React.useRef<number>(0);
  const pointerIdRef = React.useRef<number | null>(null);

  const [isOverlayVisible, setIsOverlayVisible] =
    React.useState(alwaysShowOverlay);
  const timeoutRef = React.useRef<number | null>(null);

  // peek in so people can see this overlay exists
  React.useEffect(() => {
    setIsOverlayVisible(true);
    const timeout = window.setTimeout(() => {
      if (!alwaysShowOverlay) setIsOverlayVisible(false);
    }, 5_000);

    timeoutRef.current = timeout;

    return (): void => {
      clearTimeout(timeout);
    };
  }, [alwaysShowOverlay]);

  const cancelPeekTimeout = (): void => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleStartHover: React.PointerEventHandler<HTMLDivElement> = (
    e
  ): void => {
    if (!canHover) {
      return;
    }
    setIsOverlayVisible(true);
    cancelPeekTimeout();
  };

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    pointerIdRef.current = e.pointerId;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
  };

  const handlePointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (e.pointerId !== pointerIdRef.current) {
      return;
    }
    if (canHover) {
      return;
    }

    // only count events on overlay or overlaycontent
    if (
      e.target !== overlayRef.current &&
      e.target !== overlayRef.current?.firstChild
    ) {
      return;
    }
    const deltaX = e.clientX - startXRef.current;
    const deltaY = e.clientY - startYRef.current;
    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
    // If the pointer moved more than 10 pixels, ignore
    if (distance > 10) {
      return;
    }
    setIsOverlayVisible(!isOverlayVisible);
    cancelPeekTimeout();
  };

  const handleEndHover: React.PointerEventHandler<HTMLDivElement> = (
    e
  ): void => {
    if (!canHover) {
      return;
    }
    if (alwaysShowOverlay) {
      return;
    }
    setIsOverlayVisible(false);
  };

  return (
    <div
      className={classnames(stylesheet.overlay, className, {})}
      onPointerOver={handleStartHover}
      onPointerLeave={handleEndHover}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      ref={overlayRef}
    >
      <CSSTransition
        in={isOverlayVisible}
        classNames={{ ...stylesheet }}
        appear
        timeout={150}
        mountOnEnter
        unmountOnExit
      >
        <div className={stylesheet.overlayContent}>{children}</div>
      </CSSTransition>
    </div>
  );
}
